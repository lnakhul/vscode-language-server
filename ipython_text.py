import unittest
from unittest.mock import MagicMock, Mock, patch
from IPython.core.completer import Completion

from my_module import QuartzCompleter


class TestQuartzCompleter(unittest.TestCase):

    def setUp(self):
        self.magics = MagicMock()
        self.magics.python_matches = Mock(return_value=[])
        self.magics.dir_matches = Mock(return_value=[])
        self.magics.file_matches = Mock(return_value=[])
        self.magics.quartz_matches = Mock(return_value=[])
        self.reloader = Mock()
        self.completer = QuartzCompleter(self.magics, self.reloader)

    def test_complete(self):
        # Test completing a non-empty line
        text = 'foo.bar.'
        line = text + 'b'
        cursor_pos = len(line)
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [])

        # Test completing an empty line
        text = ''
        line = text
        cursor_pos = len(line)
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [])

        # Test completing a non-existent attribute
        text = 'foo.bar.'
        line = text + 'baz'
        cursor_pos = len(line)
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [])

        # Test completing an existing attribute
        text = 'foo.bar.'
        line = text + 'b'
        cursor_pos = len(line)
        self.reloader.get_autoreload_modified = Mock(return_value=['foo'])
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [Completion('bar', -1, display='bar')])

        # Test completing an attribute that starts with an underscore
        text = 'foo._bar.'
        line = text + 'b'
        cursor_pos = len(line)
        self.reloader.get_autoreload_modified = Mock(return_value=['foo'])
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [Completion('_bar', -1, display='_bar')])

        # Test completing a module-level attribute
        text = 'foo.'
        line = text + 'b'
        cursor_pos = len(line)
        self.reloader.get_autoreload_modified = Mock(return_value=['foo'])
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [Completion('bar', -1, display='bar')])

        # Test completing a module-level attribute that starts with an underscore
        text = 'foo.'
        line = text + '_b'
        cursor_pos = len(line)
        self.reloader.get_autoreload_modified = Mock(return_value=['foo'])
        matches = self.completer.complete(text, line, cursor_pos)
        self.assertEqual(matches, [Completion('__builtins__', -1, display='__builtins__')])
