import unittest
from unittest.mock import MagicMock, patch
from IPython.core.magic_arguments import parse_argstring
from quartz import QuartzInspectMagics

class TestQuartzInspectMagics(unittest.TestCase):
    
    def setUp(self):
        self.shell = MagicMock()
        self.magics = QuartzInspectMagics(shell=self.shell)
    
    def test_qlist(self):
        with patch('quartz.quartz_inspect.listmodules') as mock_listmodules:
            mock_listmodules.return_value = {'module1': '/path/to/module1.py', 'module2': '/path/to/module2.py'}
            self.magics.qlist('')
            mock_listmodules.assert_called_once_with(include_excludes=True)
            self.shell.display_formatter.format.assert_called_once_with({'module1': '/path/to/module1.py', 'module2': '/path/to/module2.py'}, 'text/plain')
    
    def test_qimport(self):
        with patch('quartz.quartz_inspect.import_module') as mock_import_module:
            self.magics.qimport('module1 module2')
            mock_import_module.assert_any_call('module1')
            mock_import_module.assert_any_call('module2')
    
    def test_qgrep(self):
        with patch('quartz.quartz_inspect.grep') as mock_grep:
            self.magics.qgrep('pattern', 'module1 module2')
            mock_grep.assert_called_once_with('pattern', ['module1', 'module2'])
    
    def test_qsrc(self):
        with patch('quartz.quartz_inspect.getsource') as mock_getsource:
            mock_getsource.return_value = 'def foo():\n    print("Hello, world!")\n'
            self.magics.qsrc('module1.foo')
            mock_getsource.assert_called_once_with('module1.foo')
            self.shell.display_formatter.format.assert_called_once_with('def foo():\n    print("Hello, world!")\n', 'text/plain')
    
    def test_qfile(self):
        with patch('quartz.quartz_inspect.getfile') as mock_getfile:
            mock_getfile.return_value = '/path/to/module1.py'
            self.magics.qfile('module1')
            mock_getfile.assert_called_once_with('module1')
            self.shell.display_formatter.format.assert_called_once_with('/path/to/module1.py', 'text/plain')
    
    def test_qwhere(self):
        with patch('quartz.quartz_inspect.getabsfile') as mock_getabsfile:
            mock_getabsfile.return_value = '/path/to/module1.py'
