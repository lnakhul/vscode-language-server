class UserTreeManager:
    def __init__(self, db: sandra.Sandra):
        self.db = db
        self.providers: Dict[str, Type[UserDefinedTree]] = {}
        self.current_provider: Optional[UserDefinedTree] = None
        self.user_modified_modules: set[str] = set()

        # Load providers from Sandra database
        self.load_providers()

    def load_providers(self):
        try:
            container = self.db.readobj('/config/shell/vscode/trees')
            if container:
                for provider_id, provider_info in container.items():
                    module_name = provider_info['module']
                    class_name = provider_info['className']
                    display_name = provider_info.get('displayName', provider_id)
                    self._import_and_register(provider_id, module_name, class_name, display_name)
        except Exception as e:
            logger.error(f"Failed to load providers from Sandra: {e}")

    def _import_and_register(self, provider_id: str, module_name: str, class_name: str, display_name: str):
        try:
            mod = importlib.import_module(module_name)
            cls = getattr(mod, class_name)
            self.register_provider(provider_id, cls, display_name)
        except (ImportError, AttributeError) as e:
            logger.error(f"Failed to import {module_name}.{class_name}: {e}")

    def register_provider(self, name: str, provider: Type[UserDefinedTree], display_name: str) -> None:
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

    def get_children(self, provider_id: str, root_item: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if provider_id not in self.providers:
            return []
        inst = self.providers[provider_id]()
        if root_item is None:
            return inst.get_root_nodes()
        return inst.get_child_nodes(root_item['id'])

    def start_session(self):
        logger.info("Starting user tree session")
        # Implement any necessary initialization for the session

    def finish_session(self):
        logger.info("Finishing user tree session")
        # Implement any necessary cleanup for the session

    def switch_away(self):
        logger.info("Switching away from current user tree provider")
        if self.current_provider and hasattr(self.current_provider, 'on_switch_away'):
            self.current_provider.on_switch_away()
        self.current_provider = None
