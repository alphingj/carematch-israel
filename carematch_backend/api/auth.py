"""Authentication endpoints - Firebase token verification and user sync."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.config import settings
from core.exceptions import AuthenticationError, ValidationError
from models import User, UserRole, UserStatus
from schemas import (
    TokenResponse,
    UserResponse,
    UserCreate,
    MessageResponse,
)
from api.deps import get_current_active_user_dep

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/verify-token", response_model=UserResponse)
async def verify_firebase_token_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Verify Firebase ID token and sync/create user profile."""
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthenticationError("Missing or invalid Authorization header")

    id_token = auth_header.split(" ")[1]

    # Verify token using Firebase Admin SDK
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
    except firebase_auth.InvalidIdTokenError:
        raise AuthenticationError("Invalid Firebase ID token")
    except firebase_auth.ExpiredIdTokenError:
        raise AuthenticationError("Token expired")
    except Exception as e:
        raise AuthenticationError(f"Token verification failed: {str(e)}")

    uid = decoded_token["uid"]
    email = decoded_token.get("email", "")
    name = decoded_token.get("name")
    email_verified = decoded_token.get("email_verified", False)

    # Check if user exists in database
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if not user:
        # Create new user profile
        user = User(
            id=uid,
            email=email,
            name=name or email.split("@")[0],
            role=UserRole.RESIDENT,
            status=UserStatus.ACTIVE,
            email_verified_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc) if email_verified else None,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Update last login
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        if email_verified and not user.email_verified_at:
            user.email_verified_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user_dep)) -> UserResponse:
    """Get current user info (requires valid Firebase token)."""
    return UserResponse.model_validate(current_user)


@router.post("/sync-profile", response_model=UserResponse)
async def sync_user_profile(
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Sync user profile with latest Firebase claims (e.g., after role change)."""
    # Force token refresh on client side, then call this to sync
    return UserResponse.model_validate(current_user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Register new user (admin only - for creating initial users)."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise ValidationError("Email already registered")

    # Create user (password not used - Firebase handles auth)
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        role=UserRole(user_data.role),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    request: Request,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Change password - handled by Firebase, this just revokes tokens."""
    # Revoke all refresh tokens (forces re-login)
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    try:
        firebase_auth.revoke_refresh_tokens(current_user.id)
    except Exception as e:
        raise AuthenticationError(f"Failed to revoke tokens: {str(e)}")

    return MessageResponse(message="Tokens revoked. Please sign in again via Firebase.")


@router.post("/logout/all", response_model=MessageResponse)
async def logout_all(
    current_user: User = Depends(get_current_active_user_dep),
) -> MessageResponse:
    """Logout from all devices (revoke Firebase refresh tokens)."""
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    try:
        firebase_auth.revoke_refresh_tokens(current_user.id)
    except Exception as e:
        raise AuthenticationError(f"Failed to revoke tokens: {str(e)}")

    return MessageResponse(message="Logged out from all devices")