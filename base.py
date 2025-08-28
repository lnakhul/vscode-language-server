# nav.py
import os, sys, ast, importlib.util
from typing import Optional, Dict, List
from python.base import BaseRpcService

class NavService(BaseRpcService):
    PREFIX = 'nav'

    def _open_and_find(self, path: str, trail: List[str]) -> Dict:
        line = char = 0
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                src = f.read()
            if trail:
                root = ast.parse(src)
                want = set(trail)
                for i, node in enumerate(ast.walk(root)):
                    name = getattr(node, 'name', None)
                    if name in want and hasattr(node, 'lineno'):
                        line = node.lineno - 1
                        char = 0
                        break
        except Exception:
            pass
        return {"uri": os.path.abspath(path), "line": line, "character": char}

    def _resolve_dotted(self, dotted: str, project_roots: List[str]) -> Optional[Dict]:
        parts = dotted.split('.')
        module = '.'.join(parts[:-1]) if len(parts) > 1 else dotted
        symbol = parts[-1] if len(parts) > 1 else None

        # Try import machinery first
        spec = importlib.util.find_spec(module)
        candidate = None
        if spec and spec.origin and spec.origin != 'built-in':
            candidate = spec.origin
            if candidate.endswith('__init__.py'):
                # pkg, not a module file
                pass
        else:
            # Fall back to project roots
            rel = module.replace('.', '/')
            for root in project_roots:
                for sub in ['', 'src', 'tests']:
                    p = os.path.join(root, sub, f'{rel}.py')
                    if os.path.exists(p):
                        candidate = p
                        break
                if candidate: break

        if not candidate:
            return None
        trail = [symbol] if symbol else []
        return self._open_and_find(candidate, trail)

    def _resolve_pytest_nodeid(self, ref: str, project_roots: List[str]) -> Optional[Dict]:
        bits = ref.split('::')
        head, trail = bits[0], bits[1:]
        if head.endswith('.py'):
            for root in project_roots:
                p = os.path.join(root, head)
                if os.path.exists(p):
                    return self._open_and_find(p, trail)
            return None
        # dotted tests.test_mod.Class.test_fn
        return self._resolve_dotted(head, project_roots)  # will search and then drill using trail via symbol walk

    def handle_resolveSymbol(self, reference: str, filename: str, workspaceFolders: Optional[list] = None) -> Optional[Dict]:
        roots = [os.path.abspath(p) for p in (workspaceFolders or [])]
        if '::' in reference:
            return self._resolve_pytest_nodeid(reference, roots)
        if '.' in reference:
            return self._resolve_dotted(reference, roots)
        return None
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





++++++++++++++++++++++++++++++++++

from typing import Dict, Type, List
from .user_tree_api import UserDefinedTree, TreeProviderContext

class TreeProviderRegistry:
    _instance = None

    def __init__(self):
        if TreeProviderRegistry._instance is not None:
            raise Exception("This class is a singleton!")
        self.default_providers: Dict[str, Dict] = {}
        self.user_providers: Dict[str, Dict] = {}
        TreeProviderRegistry._instance = self

    @staticmethod
    def get_instance():
        if TreeProviderRegistry._instance is None:
            TreeProviderRegistry()
        return TreeProviderRegistry._instance

    def register_default_provider(self, provider_id: str, cls: Type[UserDefinedTree], display_name: str):
        """
        Register a default provider. These cannot be unregistered or overwritten by user configurations.
        """
        if provider_id in self.default_providers:
            raise ValueError(f"Default provider '{provider_id}' is already registered.")
        context = TreeProviderContext()
        instance = cls()
        instance.activate(context)
        self.default_providers[provider_id] = {
            "class": cls,
            "instance": instance,
            "displayName": display_name,
            "context": context
        }

    def register_user_provider(self, provider_id: str, cls: Type[UserDefinedTree], display_name: str):
        """
        Register a user-defined provider. These can be overwritten by user configurations.
        """
        if provider_id in self.default_providers:
            raise ValueError(f"Cannot overwrite default provider '{provider_id}'.")
        context = TreeProviderContext()
        instance = cls()
        instance.activate(context)
        self.user_providers[provider_id] = {
            "class": cls,
            "instance": instance,
            "displayName": display_name,
            "context": context
        }

    def list_providers(self) -> List[Dict]:
        """
        List all registered providers (default + user-defined).
        """
        providers = []
        for provider_id, info in {**self.default_providers, **self.user_providers}.items():
            providers.append({"id": provider_id, "displayName": info["displayName"]})
        return providers

    def get_provider(self, provider_id: str) -> Dict:
        """
        Get a provider by its ID.
        """
        return self.default_providers.get(provider_id) or self.user_providers.get(provider_id)

    def unregister_user_provider(self, provider_id: str):
        """
        Unregister a user-defined provider. Default providers cannot be unregistered.
        """
        if provider_id in self.default_providers:
            raise ValueError(f"Cannot unregister default provider '{provider_id}'.")
        self.user_providers.pop(provider_id, None)


============================

from .tree_provider_registry import TreeProviderRegistry

class ShellControlChannelProtocol(ControlChannelProtocol):
    def on_startUserTreeSession(self, message: ShellMessage):
        registry = TreeProviderRegistry.get_instance()
        providers = registry.list_providers()
        self.sendEvent('startUserTreeSessionDone', {'providers': providers})

    def on_listTreeProviders(self, message: ShellMessage):
        registry = TreeProviderRegistry.get_instance()
        providers = registry.list_providers()
        self.sendEvent('listTreeProvidersResult', {'providers': providers})

    def on_getRootItems(self, message: ShellMessage):
        registry = TreeProviderRegistry.get_instance()
        provider_id = message.get('provider_id')
        provider = registry.get_provider(provider_id)
        if provider:
            instance = provider["instance"]
            items = instance.get_children(None)
            self.sendEvent('getRootItemsResult', {'items': items})

    def on_getChildItems(self, message: ShellMessage):
        registry = TreeProviderRegistry.get_instance()
        provider_id = message.get('provider_id')
        child = message.get('child', None)
        provider = registry.get_provider(provider_id)
        if provider:
            instance = provider["instance"]
            items = instance.get_children(child)
            self.sendEvent('getChildItemsResult', {'items': items})






def handle_uploadKeybindings(self, content: str) -> bool:
    """Uploads the keybindings.json file to Sandra DB."""
    try:
        keybindings_path = f"{self.keybindings_dir}/keybindings.json"
        obj = self.db.read_or_new('Container', keybindings_path, contents=content)
        
        # Check for concurrent modification
        current_version = obj.meta.version
        obj.contents = content
        obj.write(prev_xact_id=current_version)  # Use the current version to ensure no conflicts
        return True
    except sandra.ConcurrentModificationSandraError:
        logger.warning(f"Concurrent modification detected for {keybindings_path}. Retrying...")
        # Retry logic: Read the latest version and update again
        obj = self.db.readobj(keybindings_path)
        obj.contents = content
        obj.write(prev_xact_id=obj.meta.version)
        return True
    except Exception as e:
        logger.error(f"Failed to upload keybindings: {str(e)}")
        return False
