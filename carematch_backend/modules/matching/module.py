"""Matching module for caregiver-resident matching."""

from typing import Any, Dict, List
from modules.base import (
    BaseModule,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
    ModuleCategory,
    ModuleConfig,
)


class MatchingModule(BaseModule):
    """Matching module for intelligent caregiver-resident matching."""

    @property
    def metadata(self) -> ModuleMetadata:
        return ModuleMetadata(
            name="matching",
            version="1.0.0",
            description="AI-powered caregiver-resident matching algorithm",
            category=ModuleCategory.CAREGIVER_TOOLS,
            author="Carematch Team",
            icon="users",
            enabled_by_default=True,
            tags=["matching", "ai", "recommendations", "algorithm"],
            required_permissions=["matching:read", "matching:write"],
            config_schema={
                "type": "object",
                "properties": {
                    "algorithm": {"type": "string", "enum": ["skill_based", "location_based", "hybrid", "ml"], "default": "hybrid"},
                    "max_matches": {"type": "integer", "minimum": 1, "maximum": 50, "default": 10},
                    "min_score_threshold": {"type": "number", "minimum": 0, "maximum": 1, "default": 0.5},
                    "weights": {
                        "type": "object",
                        "properties": {
                            "skills": {"type": "number", "default": 0.3},
                            "location": {"type": "number", "default": 0.25},
                            "availability": {"type": "number", "default": 0.2},
                            "experience": {"type": "number", "default": 0.15},
                            "languages": {"type": "number", "default": 0.1},
                        },
                    },
                    "auto_refresh_hours": {"type": "integer", "default": 24},
                },
            },
            default_config={
                "algorithm": "hybrid",
                "max_matches": 10,
                "min_score_threshold": 0.5,
                "weights": {
                    "skills": 0.3,
                    "location": 0.25,
                    "availability": 0.2,
                    "experience": 0.15,
                    "languages": 0.1,
                },
                "auto_refresh_hours": 24,
            },
        )

    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize matching module."""
        self.state.status = ModuleStatus.LOADED
        self.state.routes = []

    async def shutdown(self) -> None:
        """Shutdown matching module."""
        self.state.status = ModuleStatus.DISABLED

    async def health_check(self) -> Dict[str, Any]:
        """Health check for matching module."""
        return {
            "status": "healthy",
            "module": "matching",
            "details": {
                "algorithm": self.config.config.get("algorithm", "hybrid"),
                "max_matches": self.config.config.get("max_matches", 10),
                "min_score": self.config.config.get("min_score_threshold", 0.5),
            },
        }


# Module instance
module = MatchingModule()