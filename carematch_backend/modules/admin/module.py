"""Admin module for administrative functions."""

from typing import Any, Dict
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
)


class AdminModule(BaseModule):
    """Admin dashboard and management module."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="admin",
            version="1.0.0",
            description="Admin dashboard, user management, system monitoring",
            category=ModuleCategory.ADMIN,
            author="Carematch Team",
            icon="shield",
            admin_only=True,
            enabled_by_default=False,
            tags=["admin", "dashboard", "monitoring", "management"],
            required_permissions=["admin:read", "admin:write", "admin:users", "admin:modules"],
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize admin module."""
        self.state.status = ModuleStatus.LOADED
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown admin module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for admin module."""
        return {
            "status": "healthy",
            "module": "admin",
            "details": {
                "features": ["dashboard", "user_management", "module_management", "audit_logs"],
                "access": "admin_only",
            },
        }


# Module instance
module = AdminModule()