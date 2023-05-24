import asyncio

class Spinner:
    def __init__(self, message="Loading"):
        self._message = message
        self._loading = False
        self._spin_symbols = ['|', '/', '-', '\\']
        self._spin_index = 0
        self._control = FormattedTextControl(text=self._get_spinner_text())
        self._app = self._create_app()

    def _create_app(self):
        layout = Layout(Window(content=self._control))
        kb = KeyBindings()

        @kb.add('c-c')
        @kb.add('c-q')
        def _(event):
            event.app.exit()

        app = Application(layout=layout, key_bindings=kb, full_screen=True)
        return app

    def _get_spinner_text(self):
        if not self._loading:
            return [(None, f'{self._message}')]
        
        self._spin_index = (self._spin_index + 1) % len(self._spin_symbols)
        spinner_symbol = self._spin_symbols[self._spin_index]
        return [(None, f'{self._message} {spinner_symbol}')]

    def _update_spinner(self):
        while self._loading:
            self._control.text = self._get_spinner_text()
            app = get_app()
            if app:
                app.invalidate()
            time.sleep(0.1)

    def start(self):
        print("Spinner start")
        self._loading = True
        self._thread = threading.Thread(target=self._update_spinner)
        self._thread.start()
        print("Spinner start complete")

    def stop(self):
        print("Spinner stop")
        self._loading = False
        self._thread.join()
        print("Spinner stop complete")


def setup_logging(): 
    spinner = Spinner('Logging PID... ')
    
    def do_logging():
        print("Starting logging")
        logging.info('PID: %d', os.getpid())
        print("Logging complete")
    
    spinner.start()
    threading.Thread(target=do_logging).start()
    spinner.stop()
