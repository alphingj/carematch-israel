"""Users API endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from core.database import get_db
from core.exceptions import NotFoundError, ValidationError
from core.config import settings
from models import User
from schemas import (
    UserResponse,
    UserUpdate,
    UserListResponse,
    UserRoleUpdateRequest,
    PasswordChangeRequest,
    MessageResponse,
    PaginationParams,
)
from api.deps import get_current_user_dep, get_current_active_user_dep, require_admin_dep, PaginationParams

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=UserListResponse)
async def list_users(
    pagination: PaginationParams = Depends(),
    role: Optional[str] = Query(None, pattern="^(resident|caregiver|admin)$"),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> UserListResponse:
    """List all users (admin only)."""
    query = select(User)

    if role:
        query = query.where(User.role == role)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.name.ilike(search_term),
                User.email.ilike(search_term),
                User.phone.ilike(search_term),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    query = query.offset((pagination.page - 1) * pagination.page_size).limit(pagination.page_size)
    query = query.order_by(User.created_at.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=(total + pagination.page_size - 1) // pagination.page_size,
    )


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_active_user_dep)) -> UserResponse:
    """Get current user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update current user's profile."""
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_active_user_dep),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Get user by ID."""
    # Users can only view their own profile unless admin
    if current_user.role != "admin" and str(current_user.id) != user_id:
        from core.exceptions import AuthorizationError
        raise AuthorizationError("Not authorized to view this user")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", user_id)

    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update user (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", user_id)

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    role_data: UserRoleUpdateRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Update user role (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", user_id)

    # Prevent demoting the last admin
    if user.role == "admin" and role_data.role != "admin":
        admin_count_result = await db.execute(
            select(func.count(User.id)).where(User.role == "admin")
        )
        admin_count = admin_count_result.scalar() or 0
        if admin_count <= 1:
            raise ValidationError("Cannot demote the last admin user")

    user.role = role_data.role
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Delete user (admin only)."""
    if str(current_user.id) == user_id:
        raise ValidationError("Cannot delete yourself")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", user_id)

    await db.delete(user)
    await db.commit()

    return MessageResponse(message="User deleted successfully")


@router.post("/{user_id}/change-password", response_model=MessageResponse)
async def change_user_password(
    user_id: str,
    password_data: PasswordChangeRequest,
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """Change user password (admin only)."""
    from core.security import hash_password

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundError("User", user_id)

    user.hashed_password = hash_password(password_data.new_password)
    await db.commit()

    return MessageResponse(message="Password changed successfully")


@router.get("/stats/summary", response_model=dict)
async def get_user_stats(
    current_user: User = Depends(require_admin_dep),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Get user statistics (admin only)."""
    # Total users
    total_result = await db.execute(select(func.count(User.id)))
    total = total_result.scalar() or 0

    # By role
    role_result = await db.execute(
        select(User.role, func.count(User.id)).group_by(User.role)
    )
    by_role = {row[0]: row[1] for row in role_result.all()}

    # By status
    status_result = await db.execute(
        select(User.status, func.count(User.id)).group_by(User.status)
    )
    by_status = {row[0]: row[1] for row in status_result.all()}

    # Recent registrations (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    )
    recent = recent_result.scalar() or 0

    return {
        "total_users": total,
        "by_role": by_role,
        "by_status": by_status,
        "recent_registrations_30d": recent,
    }