import sys
import time
import threading
import itertools

class Spinner:
    def __init__(self, message='Loading'):
        self._message = message
        self._spin_symbols = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        self._thread = None
        self._lock = threading.Lock()
        self._loading = False

    def _spin(self):
        write, flush = sys.stdout.write, sys.stdout.flush
        for char in itertools.cycle(self._spin_symbols):
            with self._lock:
                if not self._loading:
                    break
            status = char + ' ' + self._message
            write(status)
            flush()
            time.sleep(.1)
            write('\r' + ' ' * len(status) + '\r')
            flush()
            
        self.reset()

    def start(self):
        with self._lock:
            self._loading = True
        self._thread = threading.Thread(target=self._spin)
        self._thread.start()

    def stop(self):
        with self._lock:
            self._loading = False
        if self._thread is not None:
            self._thread.join()

    def reset(self):
        write, flush = sys.stdout.write, sys.stdout.flush
        write('\r' + ' ' * (len(self._message) + 2) + '\r')
        flush()

        
  from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import TerminalFormatter
from traceback import format_exception

def my_exc_handler(shell, etype, evalue, tb, tb_offset=None):
    # Format the exception
    traceback_lines = format_exception(etype, evalue, tb)
    traceback_text = ''.join(traceback_lines)

    # Highlight the traceback
    lexer = PythonLexer()
    formatter = TerminalFormatter()
    traceback_highlighted = highlight(traceback_text, lexer, formatter)

    # Print the traceback
    shell.showtraceback((etype, evalue, tb), tb_offset=tb_offset)
    print(traceback_highlighted)

get_ipython().set_custom_exc((Exception,), my_exc_handler)


from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import TerminalFormatter
from IPython.core.ultratb import ColorTB

class SyntaxHighlightingFormatter(ColorTB):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.lexer = PythonLexer()
        self.formatter = TerminalFormatter()

    def format_exception_as_a_whole(self, etype, evalue, etb, number_of_lines_of_context, tb_offset):
        lines = super().format_exception_as_a_whole(etype, evalue, etb, number_of_lines_of_context, tb_offset)
        for i in range(len(lines)):
            if lines[i].startswith('---->'):
                lines[i] = highlight(lines[i], self.lexer, self.formatter).strip()
        return lines

get_ipython().InteractiveTB = SyntaxHighlightingFormatter()


class QuartzExceptionFormatter(ultratb.FormattedTB):
    """A Formatter that colorizes the traceback.
    """
    def __init__(self, ip):
        self.shell = ip
        self.tb_offset = 1
        self.color_scheme = 'Linux'
        self.include_vars = True
        self.long_header = True
        self.call_pdb = False
        self.justify = True
        self.num_width = 4
        self.repr = False
        self.include_rebuilt = False
        self.tb_offset = 1
        self.syntaxerror_formatter = None
        self.pdb = None
        self.prompt_manager = PromptManager(shell=ip)
        self.pdb_cls = None
        self.tb = None
        self.tb_lastline_indent = 0
        self.stb = None
        self.stb_lastline_indent = 0
        self.tb_offset = 0
        self.tb_offset = 1
        
    def __call__(self, etype, evalue, etb, tb_offset=None, context=5,
                 exception_only=False, tb_colors=None, chain=True):
        self.tb_offset = tb_offset or self.tb_offset
        return super().__call__(etype, evalue, etb, tb_offset, context,
                 exception_only, tb_colors, chain)
    
    def structured_traceback(self, etype, value, tb, tb_offset=None,
                                context=5, mode=None):
            self.tb_offset = tb_offset or self.tb_offset
            return super().structured_traceback(etype, value, tb, tb_offset, context,
                                mode)
    
    def text(self, etype=None, value=None, tb=None, tb_offset=None,
                context=5, chain=True):
            self.tb_offset = tb_offset or self.tb_offset
            return super().text(etype, value, tb, tb_offset, context, chain)
    
    def colorize_traceback(self, exc_tuple, tb_offset=None, chain=True):
            self.tb_offset = tb_offset or self.tb_offset
            return super().colorize_traceback(exc_tuple, tb_offset, chain)
        

class ColorizedTB(ultratb.ListTB):
    """A simple traceback printer which colorizes the output."""

    def __init__(self, color_scheme='Linux', call_pdb=False):
        super().__init__(color_scheme=color_scheme, call_pdb=call_pdb)

    def __call__(self, etype, evalue, etb, tb_offset=None, context=1):
        # We are ignoring tb_offset and context here to keep things simple.
        # etb:   exception traceback
        # etype: exception type
        # evalue: exception value
        self.tb = etb
        return self.text(etype, evalue, etb)

    def text(self, etype, evalue, etb):
        """Return a colorized string representation of the traceback."""
        colors = self.Colors  # This is a color table from ultratb
        etype_color = colors.normal  # Color for the exception type
        evalue_color = colors.excName  # Color for the exception value
        tb_color = colors.line  # Color for the traceback

        # Format the traceback
        traceback_lines = traceback.format_exception(etype, evalue, etb)
        colored_traceback = [tb_color + line for line in traceback_lines]

        # Format the exception
        colored_exception = [etype_color + etype.__name__,
                             evalue_color + str(evalue)]

        return "\n".join(colored_traceback + colored_exception)

from pygments import highlight
from pygments.lexers import PythonLexer
from pygments.formatters import TerminalFormatter
import traceback

class ColorizedTB(ultratb.ListTB):
    """A simple traceback printer which colorizes the output."""

    def __init__(self, color_scheme='Linux', call_pdb=False):
        # Here we pass color_scheme as a string, not an InteractiveShell instance.
        super().__init__(color_scheme=color_scheme, call_pdb=call_pdb)
        self.lexer = PythonLexer()
        self.formatter = TerminalFormatter(bg='dark')

    def __call__(self, etype, evalue, etb, tb_offset=None, context=1):
        self.tb = etb
        return self.text(etype, evalue, etb)

    def text(self, etype, evalue, etb):
        traceback_text = "".join(traceback.format_exception(etype, evalue, etb))
        highlighted_traceback = highlight(traceback_text, self.lexer, self.formatter)
        return highlighted_traceback


