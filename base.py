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
