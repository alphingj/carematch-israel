"""API dependencies."""

from typing import Optional, List
from uuid import UUID
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_db
from core.config import settings
from core.exceptions import AuthenticationError, AuthorizationError
from models import User, Module
from modules.loader import module_registry
from core.firebase_auth import (
    verify_firebase_token_string,
)

security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Get current user if token is valid, otherwise None."""
    if not credentials:
        return None

    try:
        token_data = await verify_firebase_token_string(credentials.credentials)
    except HTTPException:
        return None

    uid = token_data["uid"]
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()

    if not user or user.status != "active":
        return None

    return user


async def get_current_user_dep(
    current_user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Get current authenticated user."""
    if not current_user:
        raise AuthenticationError("Not authenticated")
    return current_user


async def get_current_active_user_dep(
    current_user: User = Depends(get_current_user_dep),
) -> User:
    """Get current active user."""
    if current_user.status != "active":
        raise AuthenticationError("Account is not active")
    return current_user


def require_role(*roles: str):
    """Dependency to require specific role(s)."""
    async def role_checker(current_user: User = Depends(get_current_active_user_dep)) -> User:
        if current_user.role not in roles:
            raise AuthorizationError(f"Requires one of roles: {', '.join(roles)}")
        return current_user
    return role_checker


require_admin_dep = require_role("admin")
require_caregiver_dep = require_role("caregiver", "admin")
require_resident_dep = require_role("resident", "admin")


async def get_module_registry():
    """Get module registry."""
    return module_registry


async def check_module_enabled(
    module_name: str,
    current_user: User = Depends(get_current_user_dep),
    registry = Depends(get_module_registry),
) -> bool:
    """Check if module is enabled for current user."""
    module = registry.get_module(module_name)
    if not module:
        return False
    return module.is_enabled_for(str(current_user.id), current_user.role)


def require_module(module_name: str):
    """Dependency to require module enabled for user."""
    async def module_checker(
        current_user: User = Depends(get_current_active_user_dep),
        registry = Depends(get_module_registry),
    ) -> User:
        module = registry.get_module(module_name)
        if not module:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Module {module_name} not found",
            )
        if not module.is_enabled_for(str(current_user.id), current_user.role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Module {module_name} not enabled for your account",
            )
        return current_user
    return module_checker


class PaginationParams:
    """Pagination parameters."""

    def __init__(
        self,
        page: int = 1,
        page_size: int = 20,
    ):
        self.page = max(1, page)
        self.page_size = min(max(1, page_size), 100)
        self.offset = (self.page - 1) * self.page_size
        self.limit = self.page_size