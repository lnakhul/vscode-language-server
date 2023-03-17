@line_magic
    def delete_profile(self, parameter_s=''):
        """Delete an existing profile.
        
        Usage:
            %delete_profile <profile_name>
        
        This magic command will delete an existing profile.
        """
        profile_name = parameter_s.strip()
        if not profile_name:
            print('Please specify a profile name.')
            return
        profile_path = os.path.join(self.shell.profile_dir.location, profile_name)
        if not os.path.exists(profile_path):
            print('Profile does not exist.')
            return
        shutil.rmtree(profile_path)
        print('Profile deleted.')
    
    def post_execute_hook(self): 
        """Cache the modification times of any modules imported in this execution
        """
        newly_loaded_modules = set(sys.modules) - self.loaded_modules 
        for modname in newly_loaded_modules: 
            _, pymtime = self._reloader.filename_and_mtime(sys.modules [modname]) 
            if pymtime is not None: 
                self._reloader.modules_mtimes[modname] = pymtime 
        self.loaded_modules.update (newly_loaded_modules)
