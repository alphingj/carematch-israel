"""Notifications module for email, push, and in-app notifications."""

from typing import Any, Dict, List
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
    ModuleConfig,
)


class NotificationsModule(BaseModule):
    """Notifications module for multi-channel messaging."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="notifications",
            version="1.0.0",
            description="Email, push, and in-app notifications",
            category=ModuleCategory.NOTIFICATIONS,
            author="Carematch Team",
            icon="bell",
            enabled_by_default=True,
            tags=["email", "push", "in-app", "sms"],
            required_permissions=["notifications:read", "notifications:write"],
            config_schema={
                "type": "object",
                "properties": {
                    "email_enabled": {"type": "boolean", "default": True},
                    "push_enabled": {"type": "boolean", "default": True},
                    "in_app_enabled": {"type": "boolean", "default": True},
                    "sms_enabled": {"type": "boolean", "default": False},
                    "email_provider": {"type": "string", "enum": ["smtp", "sendgrid", "mailgun"], "default": "smtp"},
                    "default_from_email": {"type": "string", "format": "email"},
                    "templates_dir": {"type": "string", "default": "templates/notifications"},
                },
            },
            default_config={
                "email_enabled": True,
                "push_enabled": True,
                "in_app_enabled": True,
                "sms_enabled": False,
                "email_provider": "smtp",
            },
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize notifications module."""
        self.state.status = ModuleStatus.LOADED
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown notifications module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for notifications module."""
        return {
            "status": "healthy",
            "module": "notifications",
            "details": {
                "channels": {
                    "email": self.config.config.get("email_enabled", True),
                    "push": self.config.config.get("push_enabled", True),
                    "in_app": self.config.config.get("in_app_enabled", True),
                    "sms": self.config.config.get("sms_enabled", False),
                },
                "provider": self.config.config.get("email_provider", "smtp"),
            },
        }


# Module instance
module = NotificationsModule()