"""Admin API for managing Firebase custom claims (user roles)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from core.database import get_db
from core.firebase_auth import set_user_role, get_user_by_uid
from models import User, UserRole
from schemas import MessageResponse
from api.deps import require_admin_dep

router = APIRouter(prefix="/users", tags=["admin-claims"])


@router.post("/{user_id}/set-role", response_model=MessageResponse)
async def set_user_role_endpoint(
    user_id: str,
    role: str,
    current_user = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Set user role via Firebase custom claims.
    This updates both Firebase token claims and local database.
    """
    # Validate role
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join([r.value for r in UserRole])}"
        )

    # Check if user exists in local DB
    user = await get_user_by_uid(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )

    # Prevent demoting the last admin
    if user.role == UserRole.ADMIN and user_role != UserRole.ADMIN:
        admin_count_result = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.ADMIN)
        )
        admin_count = admin_count_result.scalar() or 0
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot demote the last admin user"
            )

    # Set Firebase custom claim
    try:
        await set_user_role(user_id, user_role.value)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set Firebase custom claim: {str(e)}"
        )

    # Update local database
    user.role = user_role
    await db.commit()
    await db.refresh(user)

    return MessageResponse(
        message=f"User role updated to {user_role.value}. User must refresh their token."
    )


@router.post("/{user_id}/refresh-claims", response_model=MessageResponse)
async def refresh_user_claims(
    user_id: str,
    current_user = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Force refresh of user's custom claims by revoking their refresh tokens.
    User will need to sign in again to get new token with updated claims.
    """
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    user = await get_user_by_uid(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    try:
        # Revoke all refresh tokens - forces re-authentication
        firebase_auth.revoke_refresh_tokens(user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to revoke tokens: {str(e)}"
        )

    return MessageResponse(
        message="User tokens revoked. User must sign in again to get updated claims."
    )


@router.get("/{user_id}/claims", response_model=dict)
async def get_user_claims(
    user_id: str,
    current_user = Depends(require_admin_dep),
) -> dict:
    """Get user's current Firebase custom claims."""
    import firebase_admin
    from firebase_admin import auth as firebase_auth

    try:
        user_record = firebase_auth.get_user(user_id)
        claims = user_record.custom_claims or {}
        return {
            "uid": user_id,
            "custom_claims": claims,
            "role_from_claims": claims.get("role"),
        }
    except firebase_admin.exceptions.NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in Firebase"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get claims: {str(e)}"
        )