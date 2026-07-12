"""Firebase Authentication integration for token verification."""

import json
import logging
import os
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from core.config import settings
from core.database import get_db
from models import User, UserRole, UserStatus

logger = logging.getLogger(__name__)


def init_firebase_admin() -> None:
    """Initialize Firebase Admin SDK.

    Credential resolution order (works on Render and local):
      1. FIREBASE_SERVICE_ACCOUNT -> JSON string of a service-account key
      2. GOOGLE_APPLICATION_CREDENTIALS -> path to a service-account JSON file
      3. Application Default Credentials (ADC)
      4. Project-id-only init (verify_id_token will still work for tokens
         issued by the same Google/Firebase project, but set_custom_user_claims
         requires real credentials).

    If Firebase cannot be initialized (e.g. no key provided in dev), the app
    logs a warning and continues so the rest of the API can still serve traffic
    that does not require token verification.
    """
    if firebase_admin._apps:
        return

    project_id = settings.FIREBASE_PROJECT_ID
    cred = None

    sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if sa_json:
        try:
            cred = credentials.Certificate(json.loads(sa_json))
        except Exception as e:
            logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: {e}")

    if cred is None and os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        try:
            cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
        except Exception as e:
            logger.error(f"Failed to load GOOGLE_APPLICATION_CREDENTIALS: {e}")

    try:
        if cred is not None:
            options = {"projectId": project_id} if project_id else {}
            firebase_admin.initialize_app(cred, options)
        else:
            # No explicit credentials: rely on ADC; if unavailable, fall back
            # to project-id-only init so startup does not hard-crash.
            try:
                options = {"projectId": project_id} if project_id else {}
                firebase_admin.initialize_app(options=options)
            except Exception:
                if project_id:
                    firebase_admin.initialize_app(options={"projectId": project_id})
                else:
                    raise
        logger.info("Firebase Admin SDK initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        logger.warning(
            "Continuing without Firebase Admin SDK. Endpoints that verify "
            "Firebase ID tokens will return 401 until credentials are provided."
        )


async def verify_firebase_token(
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """Verify Firebase ID token and return decoded claims."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    if not firebase_admin._apps:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase Admin SDK not initialized; server misconfiguration",
        )

    id_token = authorization.split(" ")[1]

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revoked",
        )
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )


async def verify_firebase_token_string(id_token: str) -> Dict[str, Any]:
    """Verify Firebase ID token from string."""
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token",
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revoked",
        )
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )


async def get_current_user_id(token_data: Dict[str, Any] = Depends(verify_firebase_token)) -> str:
    """Extract user ID from verified token."""
    return token_data["uid"]


async def get_current_user_role(token_data: Dict[str, Any] = Depends(verify_firebase_token)) -> str:
    """Extract user role from token custom claims."""
    return token_data.get("role", "resident")


async def require_admin(token_data: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
    """Require admin role (from custom claims or admin emails list)."""
    role = token_data.get("role")
    email = token_data.get("email")

    is_admin = role == "admin" or (email and email in settings.ADMIN_EMAILS)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return token_data


async def require_caregiver(token_data: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
    """Require caregiver or admin role."""
    role = token_data.get("role")
    if role not in ("caregiver", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Caregiver or admin access required",
        )
    return token_data


async def require_resident(token_data: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
    """Require resident, caregiver, or admin role."""
    role = token_data.get("role")
    if role not in ("resident", "caregiver", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Resident, caregiver, or admin access required",
        )
    return token_data


async def ensure_user_profile(
    uid: str,
    email: str,
    name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Ensure user profile exists in database, create if not."""
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if user:
        # Update last login
        from datetime import datetime, timezone
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()
        return user

    # Create new user profile
    role = "resident"  # default role

    user = User(
        id=uid,
        email=email,
        name=name or email.split("@")[0],
        role=UserRole(role),
        status=UserStatus.ACTIVE,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(f"Created new user profile for {email} (uid: {uid})")
    return user


async def get_current_user(
    token_data: Dict[str, Any] = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user from database, creating profile if needed."""
    uid = token_data["uid"]
    email = token_data.get("email", "")
    name = token_data.get("name")

    user = await ensure_user_profile(uid, email, name, db)

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current active user."""
    return current_user


async def set_user_role(uid: str, role: str) -> None:
    """Set user role as Firebase custom claim."""
    try:
        await firebase_auth.set_custom_user_claims(uid, {"role": role})
        logger.info(f"Set custom claim role={role} for user {uid}")
    except Exception as e:
        logger.error(f"Failed to set custom claims: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set user role: {str(e)}",
        )


async def get_user_by_uid(uid: str, db: AsyncSession) -> Optional[User]:
    """Get user by Firebase UID."""
    result = await db.execute(select(User).where(User.id == uid))
    return result.scalar_one_or_none()


async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    """Get user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()