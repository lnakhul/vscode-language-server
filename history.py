import os
import sandra
from IPython.core.history import HistoryManager


class QuartzHistoryManager(HistoryManager):
    def __init__(self, shell=None, parent=None, hist_file=None, profile_dir=None):
        self.sandra_dir = os.path.join(sandra.connect().home, "ipython_history")
        super().__init__(shell=shell, parent=parent, hist_file=hist_file, profile_dir=profile_dir)

    def _writeout_cache(self):
        if not os.path.exists(self.sandra_dir):
            sandra.connect().mkdir(self.sandra_dir)

        history_file = os.path.join(self.sandra_dir, f"history_{self.session_number}.sqlite")
        self.db.log.setLevel(self.shell.logger.level)
        self.db.writeout_cache(history_file)

    def _init_db(self):
        if not os.path.exists(self.sandra_dir):
            sandra.connect().mkdir(self.sandra_dir)

        history_file = os.path.join(self.sandra_dir, f"history_{self.session_number}.sqlite")
        self.db = self.db_class(history_file, self.dbsize, self.validate, self.python,
                                self.shell.user_ns, self.auto_write_to_file, self.encoding, self.db_cache_size)
