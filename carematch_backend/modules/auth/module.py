"""Core module for authentication."""

from typing import Any, Dict, List, Optional
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
    ModuleConfig,
)
from core.config import settings


class AuthModule(BaseModule):
    """Core authentication module - always enabled."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="auth",
            version="1.0.0",
            description="Core authentication and authorization",
            category=ModuleCategory.CORE,
            author="Carematch Team",
            icon="shield",
            enabled_by_default=True,
            admin_only=True,
            hidden=True,
            required_permissions=["auth:read", "auth:write"],
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize auth module."""
        self.state.status = ModuleStatus.LOADED
        # Auth routes are built into core API
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown auth module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for auth module."""
        return {
            "status": "healthy",
            "module": "auth",
            "details": {
                "jwt_algorithm": settings.ALGORITHM,
                "token_expiry_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            },
        }


# Module instance
module = AuthModule()