"""Users module for user management."""

from typing import Any, Dict
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
)


class UsersModule(BaseModule):
    """User management module."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="users",
            version="1.0.0",
            description="User profiles, onboarding, and role management",
            category=ModuleCategory.USERS,
            author="Carematch Team",
            icon="users",
            enabled_by_default=True,
            tags=["users", "profile", "onboarding", "roles"],
            required_permissions=["users:read", "users:write", "users:delete"],
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize users module."""
        self.state.status = ModuleStatus.LOADED
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown users module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for users module."""
        return {
            "status": "healthy",
            "module": "users",
            "details": {
                "features": ["profile", "onboarding", "roles", "module_access"],
                "roles": ["resident", "caregiver", "admin"],
            },
        }


# Module instance
module = UsersModule()