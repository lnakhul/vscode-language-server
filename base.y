import logging
import sandra

from typing import List, Dict
from vscode.rpc_service.base import BaseRpcService

import pathlib

logger = logging.getLogger(__name__)

class GenericService(BaseRpcService):
    """Generic proxy service to interact with the backend."""
    
    PREFIX = 'generic'
    stateless = True
    
    def __init__(self, globals, control_thread):
        super().__init__(globals, control_thread)
        self.db = sandra.connect(f"homedirs/home/{sandra.USERNAME}")
        self.generic_dir = "/vscode/generic_dir"
        self.db.mkdir(self.generic_dir)
    
    def _generic_path(self, node: Dict) -> str:
        """Constructs the storage path based on its parent directory and filename."""
        path = pathlib.Path(node['path'])
        parent_dir_name = path.parent.name
        filename = path.name
        safe_name = f"{parent_dir_name}_{filename}".replace('/', '_').replace('\\', '_')
        return f"{self.generic_dir}/{safe_name}_{node['id']}"
    
    def handle_getRootNodes(self) -> List[Dict]:
        """Retrieves all root nodes from Sandra."""
        nodes = []
        for node_path in sandra.walk(self.generic_dir, db=self.db, returnDirs=False):
            obj = self.db.readobj(node_path)
            nodes.append(obj.contents)
        return nodes

    def handle_getChildNodes(self, parent_id: str) -> List[Dict]:
        """Retrieves child nodes for a given parent ID."""
        nodes = []
        parent_path = self._generic_path({'id': parent_id, 'path': ''})
        for node_path in sandra.walk(parent_path, db=self.db, returnDirs=False):
            obj = self.db.readobj(node_path)
            nodes.append(obj.contents)
        return nodes
