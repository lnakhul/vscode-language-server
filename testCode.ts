from typing import Dict, Any, Optional, List, Type
from .user_tree_api import UserDefinedTree

class SampleTree(UserDefinedTree):
    def get_root_nodes(self) -> List[Dict[str, Any]]:
        return [{"id": "root1", "label": "Root 1", "hasChildren": True}]

    def get_child_nodes(self, parent_id: str) -> List[Dict[str, Any]]:
        if parent_id == "root1":
            return [{"id": "child1", "label": "Child 1", "hasChildren": False}]
        return []

class UserTreeManager:
    def __init__(self):
        self.providers: Dict[str, Type[UserDefinedTree]] = {}
        self.current_provider: Optional[UserDefinedTree] = None
        self.user_modified_modules: set[str] = set()

        # Register a sample provider for testing
        self.register_provider("sampleProvider", SampleTree)

    def register_provider(self, name: str, provider: Type[UserDefinedTree]) -> None:
        self.providers[name] = provider
        logger.info(f"Registered provider: {name}")

    def unregister_provider(self, name: str) -> None:
        if name in self.providers:
            del self.providers[name]
            logger.info(f"Unregistered provider: {name}")

    def get_registered_providers(self) -> List[str]:
        return list(self.providers.keys())

    def switch_provider(self, name: str) -> None:
        if name in self.providers:
            self.current_provider = self.providers[name]()
            logger.info(f"Switched to provider: {name}")
            if hasattr(self.current_provider, 'on_switch_away'):
                self.current_provider.on_switch_away()
        else:
            logger.error(f"Provider {name} not found")

    def list_providers(self) -> List[Dict[str, str]]:
        results = []
        for pid, info in self.providers.items():
            results.append({"id": pid, "displayName": info.__name__})
        return results
