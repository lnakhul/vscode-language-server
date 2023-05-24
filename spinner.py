import asyncio
from prompt_toolkit import Application
from prompt_toolkit.application.current import get_app
from prompt_toolkit.key_binding import KeyBindings
from prompt_toolkit.layout.containers import Window
from prompt_toolkit.layout.controls import FormattedTextControl
from prompt_toolkit.layout.layout import Layout

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

    async def _update_spinner(self):
        while self._loading:
            self._control.text = self._get_spinner_text()
            app = get_app()
            if app:
                app.invalidate()
            await asyncio.sleep(0.1)

    def start(self):
        self._loading = True
        asyncio.run(self._spinner_task())
        self._app.run()

    async def _spinner_task(self):
        task = asyncio.ensure_future(self._update_spinner())
        await task

    def stop(self):
        self._loading = False
        app = get_app()
        if app:
            app.exit()
