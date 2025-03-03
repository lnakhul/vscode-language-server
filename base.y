# generic.py
import logging
import sandra

from typing import Dict, List, Any
from vscode.rpc_service.base import BaseRpcService

logger = logging.getLogger(__name__)

class GenericUserTreeService(BaseRpcService):
    """
    A service that manages user-defined tree providers, each storing data in Sandra.
    We store items under /vscode/generic_dir/<provider_id>/...
    """
    PREFIX = 'generic'  # So calls are 'generic:methodName' from the TS side
    stateless = True

    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        # Connect to a Sandra database. Adjust path if needed or use default sandra.db.
        self.db = sandra.connect("homedirs/home/{username}".format(username=sandra.USERNAME))
        self.generic_dir = "/vscode/generic_dir"
        self.db.mkdir(self.generic_dir)

        # Each provider is identified by a provider_id
        self.providers = {}  # provider_id -> config or so

    def handle_registerTreeProvider(self, provider_id: str, config: Dict[str, Any]) -> bool:
        """
        Register a new tree 'provider.' Typically store 'config' info about how to interpret or create data.
        We'll also create a directory for that provider if it doesn't exist.
        """
        if provider_id in self.providers:
            logger.warning(f"Provider {provider_id} already registered.")
            return False

        # Create a subdirectory for this provider in Sandra.
        provider_dir = f"{self.generic_dir}/{provider_id}"
        self.db.mkdir(provider_dir)

        self.providers[provider_id] = config
        logger.info(f"Registered new provider {provider_id} with config: {config}")
        return True

    def handle_listProviders(self) -> List[str]:
        """
        Return a list of registered provider IDs.
        """
        return list(self.providers.keys())

    def handle_getRootItems(self, provider_id: str) -> List[Dict]:
        """
        Return the top-level items for a given provider. 
        In this example, we store them in /vscode/generic_dir/<provider_id>/ as Sandra objects.
        We'll just walk the directory for any direct child objects.
        """
        if provider_id not in self.providers:
            logger.warning(f"No such provider: {provider_id}")
            return []

        provider_path = f"{self.generic_dir}/{provider_id}"
        # For demonstration, let's say the "root" items are direct children of provider_path (non-directory objects)
        items = []
        for obj_path in sandra.walk(provider_path, db=self.db, returnDirs=False, recurse=False):
            # read the object
            obj = self.db.readobj(obj_path)
            if obj:
                data = obj.contents if hasattr(obj, 'contents') else {}
                # Guarantee 'id', 'label' in the returned data
                # If the object doesn't store them, we can fake them
                data_id = data.get("id", obj_path)
                data_label = data.get("label", data_id)
                hasChildren = data.get("hasChildren", False)
                items.append({
                    "id": data_id,
                    "label": data_label,
                    "hasChildren": hasChildren,
                    "path": obj_path
                })
        return items

    def handle_getChildItems(self, provider_id: str, parent_id: str) -> List[Dict]:
        """
        Return child items for the object with ID=parent_id under a given provider.
        In this example, we do a naive approach: 
         - Convert parent_id to path 
         - If parent is a directory, list sub-objects
         - Or if parent is a container object with references, do something else.
        """
        if provider_id not in self.providers:
            logger.warning(f"No such provider: {provider_id}")
            return []

        # We expect the parent path to be something we stored in the object's 'path' field. 
        # The TS side must pass us the 'path' or we do an ID-> path mapping. 
        # For demonstration, let's say the TS side passes: {provider_id, parent_id, parent_path}
        # But we'll keep it simpler, just assume parent's directory is /vscode/generic_dir/<provider_id>/<parent_id>
        parent_path = f"{self.generic_dir}/{provider_id}/{parent_id}"  # might or might not exist
        obj = self.db.readobj(parent_path)
        if not obj:
            return []

        if not hasattr(obj, 'contents'):
            return []

        parent_data = obj.contents
        # Suppose the parent lists child references in parent_data["childPaths"] (a list of strings)
        child_paths = parent_data.get("childPaths", [])
        items = []
        for cpath in child_paths:
            cobj = self.db.readobj(cpath)
            if cobj:
                cdata = cobj.contents
                data_id = cdata.get("id", cpath)
                data_label = cdata.get("label", data_id)
                hasChildren = cdata.get("hasChildren", False)
                items.append({
                    "id": data_id,
                    "label": data_label,
                    "hasChildren": hasChildren,
                    "path": cpath
                })
        return items

    def handle_executeUserCommand(self, provider_id: str, command_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        A user command invoked from the TS side. The user might do e.g. "AddChild", "RemoveItem", etc.
        We'll do a stub here that logs the action.
        """
        logger.info(f"executeUserCommand for provider={provider_id}, command={command_name}, args={args}")

        # For example, if command_name == 'addChild', we might create a new Sandra object 
        if command_name == 'addChild':
            parent_id = args.get("parentId")
            label = args.get("label", "New Child")
            # create a path for it
            new_path = f"{self.generic_dir}/{provider_id}/{label.replace(' ', '_')}"
            new_obj = self.db.read_or_new('Container', new_path, contents={
                "id": label,
                "label": label,
                "hasChildren": False
            })
            new_obj.write()
            # Also, add to parent's childPaths
            parent_path = f"{self.generic_dir}/{provider_id}/{parent_id}"
            parent_obj = self.db.readobj(parent_path)
            if parent_obj:
                pc = parent_obj.contents
                child_list = pc.get("childPaths", [])
                child_list.append(new_path)
                pc["childPaths"] = child_list
                parent_obj.write()
            return {"success": True, "message": f"Child '{label}' added."}
        # else ...
        return {"success": True, "message": f"Command {command_name} not specifically handled."}
