import threading
import itertools
import time
import sys

class Spinner:
    def __init__(self, message='Loading'):
        self._message = message
        self._loading = False
        self._spin_symbols = ['|', '/', '-', '\\']
        self._thread = None

    def _spin(self):
        write, flush = sys.stdout.write, sys.stdout.flush
        for char in itertools.cycle(self._spin_symbols):
            status = char + ' ' + self._message
            write(status)
            flush()
            write('\x08' * len(status))
            time.sleep(.1)
            if not self._loading:
                break

        self.reset()

    def start(self):
        self._loading = True
        self._thread = threading.Thread(target=self._spin)
        self._thread.start()

    def stop(self):
        self._loading = False

    def reset(self):
        write, flush = sys.stdout.write, sys.stdout.flush
        status = ' ' * len(self._message)
        write(' ' * len(status) + '\x08' * len(status))
        flush()

