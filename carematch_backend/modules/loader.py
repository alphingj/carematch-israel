"""Module loader and registry - discovers, loads, and manages modules."""

import importlib
import importlib.util
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Type

from core.database import get_db_context
from modules.base import (
    BaseModule,
    ModuleConfig,
    ModuleInfo,
    ModuleMetadata,
    ModuleState,
    ModuleStatus,
)
from models import Module as ModuleModel
from sqlalchemy import select

logger = logging.getLogger(__name__)


class ModuleLoader:
    """Discovers and loads modules from the modules directory."""

    def __init__(self, modules_dir: str = "modules"):
        self.modules_dir = Path(modules_dir).resolve()
        self._discovered_modules: Dict[str, Type[BaseModule]] = {}
        self._loaded_modules: Dict[str, BaseModule] = {}
        self._module_configs: Dict[str, ModuleConfig] = {}

    def discover_modules(self) -> Dict[str, Type[BaseModule]]:
        """Discover all modules in the modules directory."""
        self._discovered_modules.clear()

        if not self.modules_dir.exists():
            logger.warning(f"Modules directory not found: {self.modules_dir}")
            return self._discovered_modules

        # Add modules directory to Python path
        if str(self.modules_dir.parent) not in sys.path:
            sys.path.insert(0, str(self.modules_dir.parent))

        for module_path in self.modules_dir.iterdir():
            if not module_path.is_dir():
                continue
            if module_path.name.startswith("_"):
                continue
            if module_path.name == "base":
                continue

            module_file = module_path / "module.py"
            if not module_file.exists():
                continue

            try:
                module_class = self._load_module_class(module_path.name, module_file)
                if module_class:
                    self._discovered_modules[module_path.name] = module_class
                    logger.info(f"Discovered module: {module_path.name}")
            except Exception as e:
                logger.error(f"Failed to discover module {module_path.name}: {e}")

        return self._discovered_modules

    def _load_module_class(self, module_name: str, module_file: Path) -> Optional[Type[BaseModule]]:
        """Load module class from module.py file."""
        spec = importlib.util.spec_from_file_location(f"modules.{module_name}.module", module_file)
        if not spec or not spec.loader:
            return None

        module = importlib.util.module_from_spec(spec)
        sys.modules[f"modules.{module_name}.module"] = module
        spec.loader.exec_module(module)

        # Find BaseModule subclass
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and issubclass(attr, BaseModule) and attr is not BaseModule:
                return attr

        return None

    def get_discovered_modules(self) -> Dict[str, Type[BaseModule]]:
        """Get all discovered module classes."""
        return self._discovered_modules.copy()


class ModuleRegistry:
    """Registry for managing loaded module instances."""

    def __init__(self, loader: ModuleLoader):
        self.loader = loader
        self._modules: Dict[str, BaseModule] = {}
        self._module_configs: Dict[str, ModuleConfig] = {}
        self._event_handlers: Dict[str, List[Any]] = {}
        self._routes: List[Any] = []

    async def load_all(self, app: Any, db: Any) -> Dict[str, BaseModule]:
        """Load all discovered modules."""
        discovered = self.loader.discover_modules()

        for name, module_class in discovered.items():
            try:
                await self.load_module(name, module_class, app, db)
            except Exception as e:
                logger.error(f"Failed to load module {name}: {e}")

        return self._modules.copy()

    async def load_module(
        self, name: str, module_class: Type[BaseModule], app: Any, db: Any
    ) -> BaseModule:
        """Load a specific module."""
        if name in self._modules:
            logger.warning(f"Module {name} already loaded")
            return self._modules[name]

        # Get config from database
        config = await self._get_module_config(name)

        # Create instance
        module = module_class(config=config)
        module.state.status = ModuleStatus.LOADING

        try:
            await module.initialize(app, db)
            module.state.status = ModuleStatus.LOADED
            module.state.loaded_at = __import__("datetime").datetime.utcnow()

            # Auto-enable if configured
            if config.enabled:
                module.state.status = ModuleStatus.ENABLED
                module.state.enabled_at = __import__("datetime").datetime.utcnow()
                await module.on_enable()

            self._modules[name] = module
            self._collect_routes(module)
            self._collect_event_handlers(module)

            logger.info(f"Module {name} loaded successfully")
            return module

        except Exception as e:
            module.state.status = ModuleStatus.ERROR
            module.state.error = str(e)
            logger.error(f"Failed to load module {name}: {e}")
            raise

    async def _get_module_config(self, name: str) -> ModuleConfig:
        """Get module configuration from database."""
        if name in self._module_configs:
            return self._module_configs[name]

        async with get_db_context() as db:
            result = await db.execute(select(ModuleModel).where(ModuleModel.name == name))
            module_model = result.scalar_one_or_none()

            if module_model:
                config = ModuleConfig(
                    enabled=module_model.enabled,
                    config=module_model.config or {},
                    enabled_for_users=module_model.enabled_for_users or [],
                    enabled_for_roles=module_model.enabled_for_roles or [],
                    disabled_for_users=module_model.disabled_for_users or [],
                )
            else:
                config = ModuleConfig()

        self._module_configs[name] = config
        return config

    async def save_module_config(self, name: str, config: ModuleConfig) -> None:
        """Save module configuration to database."""
        async with get_db_context() as db:
            result = await db.execute(select(ModuleModel).where(ModuleModel.name == name))
            module_model = result.scalar_one_or_none()

            if module_model:
                module_model.enabled = config.enabled
                module_model.config = config.config
                module_model.enabled_for_users = config.enabled_for_users
                module_model.enabled_for_roles = config.enabled_for_roles
                module_model.disabled_for_users = config.disabled_for_users
            else:
                module_model = ModuleModel(
                    name=name,
                    enabled=config.enabled,
                    config=config.config,
                    enabled_for_users=config.enabled_for_users,
                    enabled_for_roles=config.enabled_for_roles,
                    disabled_for_users=config.disabled_for_users,
                )
                db.add(module_model)

            await db.commit()

        self._module_configs[name] = config

        # Update module instance if loaded
        if name in self._modules:
            self._modules[name].config = config

    def _collect_routes(self, module: BaseModule) -> None:
        """Collect routes from module."""
        for route in module.get_routes():
            self._routes.append(route)

    def _collect_event_handlers(self, module: BaseModule) -> None:
        """Collect event handlers from module."""
        for event, handlers in module.get_event_handlers().items():
            if event not in self._event_handlers:
                self._event_handlers[event] = []
            self._event_handlers[event].extend(handlers)

    def get_module(self, name: str) -> Optional[BaseModule]:
        """Get loaded module by name."""
        return self._modules.get(name)

    def get_all_modules(self) -> Dict[str, BaseModule]:
        """Get all loaded modules."""
        return self._modules.copy()

    def get_module_info(self, name: str) -> Optional[ModuleInfo]:
        """Get module info for API."""
        module = self._modules.get(name)
        if not module:
            return None
        return ModuleInfo.from_module(module)

    def get_all_module_infos(self) -> List[ModuleInfo]:
        """Get info for all modules."""
        return [ModuleInfo.from_module(m) for m in self._modules.values()]

    def get_routes(self) -> List[Any]:
        """Get all collected routes."""
        return self._routes.copy()

    def get_event_handlers(self) -> Dict[str, List[Any]]:
        """Get all collected event handlers."""
        return {k: v.copy() for k, v in self._event_handlers.items()}

    async def enable_module(self, name: str, user_id: Optional[str] = None) -> bool:
        """Enable a module."""
        module = self._modules.get(name)
        if not module:
            return False

        await module.enable(user_id)
        module.config.enabled = True
        await self.save_module_config(name, module.config)
        return True

    async def disable_module(self, name: str, user_id: Optional[str] = None) -> bool:
        """Disable a module."""
        module = self._modules.get(name)
        if not module:
            return False

        await module.disable(user_id)
        module.config.enabled = False
        await self.save_module_config(name, module.config)
        return True

    async def enable_module_for_user(self, name: str, user_id: str) -> bool:
        """Enable module for specific user."""
        module = self._modules.get(name)
        if not module:
            return False

        if user_id not in module.config.enabled_for_users:
            module.config.enabled_for_users.append(user_id)
            await self.save_module_config(name, module.config)
        return True

    async def disable_module_for_user(self, name: str, user_id: str) -> bool:
        """Disable module for specific user."""
        module = self._modules.get(name)
        if not module:
            return False

        if user_id in module.config.enabled_for_users:
            module.config.enabled_for_users.remove(user_id)
        if user_id not in module.config.disabled_for_users:
            module.config.disabled_for_users.append(user_id)
        await self.save_module_config(name, module.config)
        return True

    async def enable_module_for_role(self, name: str, role: str) -> bool:
        """Enable module for role."""
        module = self._modules.get(name)
        if not module:
            return False

        if role not in module.config.enabled_for_roles:
            module.config.enabled_for_roles.append(role)
            await self.save_module_config(name, module.config)
        return True

    async def disable_module_for_role(self, name: str, role: str) -> bool:
        """Disable module for role."""
        module = self._modules.get(name)
        if not module:
            return False

        if role in module.config.enabled_for_roles:
            module.config.enabled_for_roles.remove(role)
        await self.save_module_config(name, module.config)
        return True

    async def update_module_config(self, name: str, config: Dict[str, Any]) -> bool:
        """Update module configuration."""
        module = self._modules.get(name)
        if not module:
            return False

        module.config.config.update(config)
        await self.save_module_config(name, module.config)
        return True

    async def unload_module(self, name: str) -> bool:
        """Unload a module."""
        module = self._modules.get(name)
        if not module:
            return False

        module.state.status = ModuleStatus.UNLOADING
        await module.shutdown()

        # Remove routes and handlers
        self._routes = [r for r in self._routes if r not in module.get_routes()]
        for event, handlers in module.get_event_handlers().items():
            if event in self._event_handlers:
                self._event_handlers[event] = [h for h in self._event_handlers[event] if h not in handlers]

        del self._modules[name]
        logger.info(f"Module {name} unloaded")
        return True

    async def reload_module(self, name: str, app: Any, db: Any) -> bool:
        """Reload a module."""
        module_class = self.loader._discovered_modules.get(name)
        if not module_class:
            return False

        await self.unload_module(name)
        await self.load_module(name, module_class, app, db)
        return True

    async def health_check_all(self) -> Dict[str, Dict[str, Any]]:
        """Run health checks on all modules."""
        results = {}
        for name, module in self._modules.items():
            try:
                results[name] = await module.health_check()
            except Exception as e:
                results[name] = {"status": "unhealthy", "error": str(e)}
        return results


# Module-level instances for easy import
module_loader = ModuleLoader()
module_registry = ModuleRegistry(module_loader)