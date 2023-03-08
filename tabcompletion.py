class QuartzCompleter(Completer):
    
    def __init__(self):
        super().__init__()
        self.loaded_modules = set(sys.modules)
    
    def complete(self, event):
        if event.symbol == '%':
            return self._complete_magic(event)
        elif event.symbol == ' ':
            return self._complete_space(event)
        else:
            return self._complete_default(event)
        
    def _complete_magic(self, event):
        if event.line.startswith('%qz'):
            return self._complete_qz_magic(event)
        else:
            return self._complete_default(event)
    
    def _complete_qz_magic(self, event):
        if event.line.startswith('%qzreload'):
            return self._complete_qzreload(event)
        elif event.line.startswith('%qzimport'):
            return self._complete_qzimport(event)
        else:
            return self._complete_default(event)
    
    def _complete_qzreload(self, event):
        if event.line == '%qzreload':
            return ['%qzreload 0', '%qzreload 1', '%qzreload 2']
        else:
            return self._complete_default(event)
        
    def _complete_qzimport(self, event):
        if event.line == '%qzimport':
            return ['%qzimport ' + mod for mod in self.loaded_modules]
        else:
            return self._complete_default(event)
    
    def _complete_space(self, event):
        if event.line.startswith('%qzimport'):
            return self._complete_qzimport(event)
        else:
            return self._complete_default(event)
    
    def _complete_default(self, event):
        raise TryNext()
