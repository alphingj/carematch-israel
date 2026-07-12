"""Reporting module for analytics and reports."""

from typing import Any, Dict, List
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
    ModuleConfig,
)


class ReportingModule(BaseModule):
    """Reporting module for analytics, dashboards, and exports."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="reporting",
            version="1.0.0",
            description="Analytics, reports, and data export",
            category=ModuleCategory.REPORTING,
            author="Carematch Team",
            icon="bar-chart",
            enabled_by_default=True,
            admin_only=True,
            tags=["analytics", "reports", "export", "dashboard", "metrics"],
            required_permissions=["reporting:read", "reporting:export"],
            config_schema={
                "type": "object",
                "properties": {
                    "retention_days": {"type": "integer", "minimum": 30, "maximum": 365, "default": 90},
                    "export_formats": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["csv", "excel", "pdf", "json"]},
                        "default": ["csv", "excel"],
                    },
                    "scheduled_reports": {"type": "boolean", "default": False},
                    "cache_ttl_seconds": {"type": "integer", "default": 300},
                },
            },
            default_config={
                "retention_days": 90,
                "export_formats": ["csv", "excel"],
                "scheduled_reports": False,
                "cache_ttl_seconds": 300,
            },
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize reporting module."""
        self.state.status = ModuleStatus.LOADED
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown reporting module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for reporting module."""
        return {
            "status": "healthy",
            "module": "reporting",
            "details": {
                "retention_days": self.config.config.get("retention_days", 90),
                "export_formats": self.config.config.get("export_formats", ["csv", "excel"]),
                "cache_ttl": self.config.config.get("cache_ttl_seconds", 300),
            },
        }


# Module instance
module = ReportingModule()