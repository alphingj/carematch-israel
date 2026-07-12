"""Module system base classes and interfaces."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Type
from pydantic import BaseModel, Field


class ModuleStatus(str, Enum):
    """Module status states."""

    DISCOVERED = "discovered"
    LOADING = "loading"
    LOADED = "loaded"
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"
    UNLOADING = "unloading"


class ModuleCategory(str, Enum):
    """Module categories for organization."""

    CORE = "core"
    JOBS = "jobs"
    USERS = "users"
    ADMIN = "admin"
    NOTIFICATIONS = "notifications"
    REPORTING = "reporting"
    INTEGRATIONS = "integrations"
    CAREGIVER_TOOLS = "caregiver_tools"
    RESIDENT_TOOLS = "resident_tools"
    CUSTOM = "custom"


@dataclass
class ModuleMetadata:
    """Module metadata and configuration."""

    name: str
    version: str
    description: str
    category: ModuleCategory = ModuleCategory.CUSTOM
    author: str = "Carematch Team"
    license: str = "MIT"
    homepage: str = ""
    repository: str = ""
    dependencies: List[str] = field(default_factory=list)
    required_permissions: List[str] = field(default_factory=list)
    config_schema: Dict[str, Any] = field(default_factory=dict)
    default_config: Dict[str, Any] = field(default_factory=dict)
    min_core_version: str = "1.0.0"
    max_core_version: str = ""
    tags: List[str] = field(default_factory=list)
    icon: str = "puzzle"
    enabled_by_default: bool = False
    admin_only: bool = False
    hidden: bool = False


@dataclass
class ModuleState:
    """Runtime module state."""

    metadata: ModuleMetadata
    status: ModuleStatus = ModuleStatus.DISCOVERED
    loaded_at: Optional[datetime] = None
    enabled_at: Optional[datetime] = None
    error: Optional[str] = None
    config: Dict[str, Any] = field(default_factory=dict)
    routes: List[Any] = field(default_factory=list)
    event_handlers: Dict[str, List[Any]] = field(default_factory=dict)
    background_tasks: List[Any] = field(default_factory=list)
    health_check: Optional[callable] = None


class ModuleConfig(BaseModel):
    """Module configuration model."""

    enabled: bool = False
    config: Dict[str, Any] = Field(default_factory=dict)
    enabled_for_users: List[str] = Field(default_factory=list)  # user IDs
    enabled_for_roles: List[str] = Field(default_factory=list)
    disabled_for_users: List[str] = Field(default_factory=list)


class BaseModule(ABC):
    """Base class for all modules."""

    metadata: ModuleMetadata
    state: ModuleState

    def __init__(self, config: Optional[ModuleConfig] = None):
        self.config = config or ModuleConfig()
        self.state = ModuleState(metadata=self.metadata)
        self._initialized = False

    @property
    @abstractmethod
    def metadata(self) -> ModuleMetadata:
        """Return module metadata."""
        pass

    @abstractmethod
    async def initialize(self, app: Any, db: Any) -> None:
        """Initialize module with application context."""
        pass

    @abstractmethod
    async def shutdown(self) -> None:
        """Cleanup module resources."""
        pass

    async def enable(self, user_id: Optional[str] = None) -> None:
        """Enable module for specific user or globally."""
        self.state.status = ModuleStatus.ENABLED
        self.state.enabled_at = datetime.utcnow()
        await self.on_enable(user_id)

    async def disable(self, user_id: Optional[str] = None) -> None:
        """Disable module for specific user or globally."""
        self.state.status = ModuleStatus.DISABLED
        await self.on_disable(user_id)

    async def on_enable(self, user_id: Optional[str] = None) -> None:
        """Called when module is enabled. Override in subclass."""
        pass

    async def on_disable(self, user_id: Optional[str] = None) -> None:
        """Called when module is disabled. Override in subclass."""
        pass

    async def health_check(self) -> Dict[str, Any]:
        """Health check endpoint. Override in subclass."""
        return {"status": "healthy", "module": self.metadata.name}

    def get_routes(self) -> List[Any]:
        """Return FastAPI routes for this module."""
        return self.state.routes

    def get_event_handlers(self) -> Dict[str, List[Any]]:
        """Return event handlers for this module."""
        return self.state.event_handlers

    def is_enabled_for(self, user_id: str, user_role: str) -> bool:
        """Check if module is enabled for a specific user."""
        if not self.config.enabled:
            return False
        if self.config.disabled_for_users and user_id in self.config.disabled_for_users:
            return False
        if self.config.enabled_for_users and user_id not in self.config.enabled_for_users:
            return False
        if self.config.enabled_for_roles and user_role not in self.config.enabled_for_roles:
            return False
        return True


class ModuleInfo(BaseModel):
    """Module information for API responses."""

    name: str
    version: str
    description: str
    category: str
    author: str
    status: str
    enabled: bool
    config: Dict[str, Any]
    enabled_for_users: List[str]
    enabled_for_roles: List[str]
    disabled_for_users: List[str]
    dependencies: List[str]
    required_permissions: List[str]
    icon: str
    tags: List[str]
    admin_only: bool
    hidden: bool
    health: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    @classmethod
    def from_module(cls, module: BaseModule) -> "ModuleInfo":
        """Create ModuleInfo from module instance."""
        return cls(
            name=module.metadata.name,
            version=module.metadata.version,
            description=module.metadata.description,
            category=module.metadata.category.value,
            author=module.metadata.author,
            status=module.state.status.value,
            enabled=module.config.enabled,
            config=module.config.config,
            enabled_for_users=module.config.enabled_for_users,
            enabled_for_roles=module.config.enabled_for_roles,
            disabled_for_users=module.config.disabled_for_users,
            dependencies=module.metadata.dependencies,
            required_permissions=module.metadata.required_permissions,
            icon=module.metadata.icon,
            tags=module.metadata.tags,
            admin_only=module.metadata.admin_only,
            hidden=module.metadata.hidden,
            health=None,
            error=module.state.error,
        )