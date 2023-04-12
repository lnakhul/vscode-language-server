import os
import sandra
from IPython.core.history import HistoryManager, extract_hist_ranges
from typing import List, Tuple, Optional

class SandraHistoryManager(HistoryManager):
    def __init__(self, shell=None, config=None, **traits):
        super().__init__(shell, config, **traits)
        self.user = sandra.connect(f"homedirs/home/{sandra.USERNAME}")
        self.history_container = self.user.read_or_new("Container", "/vscode/ipython_history")

    def _get_hist_file_name(self, session: int) -> str:
        return f"history_session_{session}.txt"

    def _load_session(self, session: int) -> List[str]:
        hist_file = self._get_hist_file_name(session)
        if hist_file in self.history_container:
            with self.history_container.open(hist_file) as f:
                return f.readlines()
        return []

    def _save_session(self, session: int, lines: List[str]) -> None:
        hist_file = self._get_hist_file_name(session)
        with self.history_container.open(hist_file, mode="w") as f:
            f.writelines(lines)

    def writeout_cache(self, session: Optional[int] = None) -> None:
        session = session or self.session_number
        lines = [entry.source for entry in self.input_hist_cache]
        self._save_session(session, lines)
        self.input_hist_cache = []

    def get_range_session(self, session: int) -> List[Tuple[int, str]]:
        lines = self._load_session(session)
        return [(i + 1, line.rstrip()) for i, line in enumerate(lines)]

    def search(self, pattern: str, raw: bool = False, output: bool = False, n: int = 1000, unique: bool = False):
        # This method is a simplified version of the original search method
        # that only supports searching the input history.
        for session in range(1, self.session_number + 1):
            hist = self._load_session(session)
            for lineno, line in enumerate(hist, start=1):
                if pattern in line:
                    yield (session, lineno, line.rstrip())

    def get_tail(self, n: int, raw: bool = False, output: bool = False, include_latest: bool = False):
        for session in range(self.session_number, 0, -1):
            hist = self._load_session(session)
            tail = hist[-n:]
            for lineno, line in enumerate(tail, start=len(hist) - len(tail) + 1):
                yield (session, lineno, line.rstrip())

def load_ipython_extension(ip):
    # ...
    # Replace the original HistoryManager with the custom SandraHistoryManager
    ip.history_manager = SandraHistoryManager(shell=ip)
    # ...
