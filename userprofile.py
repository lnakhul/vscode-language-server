from IPython.core.profiledir import ProfileDir
from IPython.terminal.ipapp import load_default_config

class UserProfile:
    def __init__(self, profile_name='default'):
        self.profile_name = profile_name
        self.profile_dir = ProfileDir.create_profile_dir(profile_name)
        self.config = load_default_config()
        self.config.TerminalInteractiveShell.autoreload = True
        
        self.srcdb = None  # set by `set_srcdb()` method
        self._setup_magic()

    def set_srcdb(self, srcdb):
        self.srcdb = srcdb

    def _setup_magic(self):
        from IPython.core.magic import register_line_magic
        from IPython.extensions.autoreload import AutoreloadMagics

        # register %qzreload and %qzimport magics
        self.config.InteractiveShellApp.extensions = [
            'IPython.extensions.autoreload', 'quartz_extension'
        ]
        
        @register_line_magic
        def qzreload(line):
            quartz_magic = self._get_quartz_magic()
            quartz_magic.qzreload(line)

        @register_line_magic
        def qzimport(line):
            quartz_magic = self._get_quartz_magic()
            quartz_magic.qzimport(line)

        # add AutoreloadMagics
        autoreload_magic = AutoreloadMagics(shell=self.config.TerminalInteractiveShell)
        autoreload_magic.extension = 'quartz_extension'
        autoreload_magic.post_config()

    def _get_quartz_magic(self):
        from IPython.core.magic import get_magics_class
        QuartzReloadMagics = get_magics_class(['quartz_extension'], 'QuartzReloadMagics')
        return QuartzReloadMagics(shell=self.config.TerminalInteractiveShell, srcdb=self.srcdb)
