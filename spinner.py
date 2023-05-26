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

