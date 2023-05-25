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
        self._lock = threading.Lock()

    def _spin(self):
        write, flush = sys.stdout.write, sys.stdout.flush
        for char in itertools.cycle(self._spin_symbols):
            with self._lock:
                if not self._loading:
                    break
            status = char + ' ' + self._message
            write(status)
            flush()
            write('\x08' * len(status))
            time.sleep(.1)
        write(' ' * len(status) + '\x08' * len(status))

    def start(self):
        with self._lock:
            if self._thread is not None:
                return
            self._loading = True
            self._thread = threading.Thread(target=self._spin)
            self._thread.start()

    def stop(self):
        with self._lock:
            self._loading = False
            if self._thread is not None:
                self._thread.join()
                self._thread = None

if __name__ == '__main__':
    spinner = Spinner('Loading data...')
    try:
        spinner.start()
        # Simulating long running task
        time.sleep(5)
    except KeyboardInterrupt:
        pass
    finally:
        spinner.stop()
