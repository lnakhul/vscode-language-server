import os
from IPython.core.profileapp import ProfileApp
from IPython.paths import get_ipython_dir
import shutil
from IPython.core.magic import Magics, magics_class, line_magic
import argparse
from IPython.core.magic import line_magic, Magics, magics_class

@magics_class
class ProfileMagics(Magics):
    
    @line_magic
    def profile(self, line):
        parser = argparse.ArgumentParser(prog='%profile', description='Manage profiles.')
        subparsers = parser.add_subparsers(dest='subcommand', required=True)

        create_parser = subparsers.add_parser('create', help='Create a new profile.')
        create_parser.add_argument('profile_name', help='Name of the profile to create.')

        delete_parser = subparsers.add_parser('delete', help='Delete a profile.')
        delete_parser.add_argument('profile_name', help='Name of the profile to delete.')

        switch_parser = subparsers.add_parser('switch', help='Switch to a specific profile.')
        switch_parser.add_argument('profile_name', help='Name of the profile to switch to.')

        args = parser.parse_args(line.split())

        if args.subcommand == 'create':
            self.create_profile(args.profile_name)
        elif args.subcommand == 'delete':
            self.delete_profile(args.profile_name)
        elif args.subcommand == 'switch':
            self.switch_profile(args.profile_name)

    @line_magic
    def create_profile(self, profile_name):
        app = ProfileApp()
        app.config_file_name = f"ipython_config_{profile_name}.py"
        app.profile_dir = os.path.join(get_ipython_dir(), f"profile_{profile_name}")
        app.initialize([])
        app.start()
        print(f"Created profile: {profile_name}")

    @line_magic
    def delete_profile(self, profile_name):
        profile_dir = os.path.join(get_ipython_dir(), f"profile_{profile_name}")
        if os.path.exists(profile_dir):
            shutil.rmtree(profile_dir)
            print(f"Deleted profile: {profile_name}")
        else:
            print(f"No profile found with the name: {profile_name}")

    @line_magic
    def switch_profile(self, profile_name):
        profile_dir = os.path.join(get_ipython_dir(), f"profile_{profile_name}")
        if os.path.exists(profile_dir):
            os.environ["IPYTHONDIR"] = profile_dir
            print(f"Switched to profile: {profile_name}")
        else:
            print(f"No profile found with the name: {profile_name}")
            
           --------------------------------------------------------------------------
        
        from IPython.core.profiledir import ProfileDir
from IPython.core.magic import line_magic, Magics, magics_class
from IPython.core.getipython import get_ipython

@magics_class
class CustomProfileMagics(Magics):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.profile_dir = ProfileDir.create_profile_dir()
    
    @line_magic
    def profile_create(self, parameter_s=''):
        """Create a new profile with the given name."""
        if not parameter_s:
            print("Usage: %profile_create <profile_name>")
            return
        profile_name = parameter_s.strip()
        if self.profile_dir.profile_exists(profile_name):
            print(f"Profile '{profile_name}' already exists.")
            return
        self.profile_dir.copy_config_to_profile(profile_name)
        print(f"Profile '{profile_name}' created.")
    
    @line_magic
    def profile_switch(self, parameter_s=''):
        """Switch to the given profile."""
        if not parameter_s:
            print("Usage: %profile_switch <profile_name>")
            return
        profile_name = parameter_s.strip()
        if not self.profile_dir.profile_exists(profile_name):
            print(f"Profile '{profile_name}' does not exist.")
            return
        self.profile_dir.switch_profile(profile_name)
        print(f"Switched to profile '{profile_name}'.")
    
    @line_magic
    def profile_delete(self, parameter_s=''):
        """Delete the given profile."""
        if not parameter_s:
            print("Usage: %profile_delete <profile_name>")
            return
        profile_name = parameter_s.strip()
        if not self.profile_dir.profile_exists(profile_name):
            print(f"Profile '{profile_name}' does not exist.")
            return
        self.profile_dir.delete_profile(profile_name)
        print(f"Profile '{profile_name}' deleted.")
    
    @line_magic
    def profile_startup(self, parameter_s=''):
        """Create a startup script for the current profile."""
        profile_name = self.profile_dir.active_profile
        startup_file = self.profile_dir.get_startup_file()
        with open(startup_file, 'w') as f:
            f.write(parameter_s)
        print(f"Startup script saved for profile '{profile_name}'.")
    
    @line_magic
    def profile_config(self, parameter_s=''):
        """Open the configuration file for the current profile."""
        profile_name = self.profile_dir.active_profile
        config_file = self.profile_dir.get_config_file()
        get_ipython().system_editor(config_file)
        print(f"Configuration file opened for profile '{profile_name}'.")



// Modify the webview's CSP to allow loading of local resources
    const csp = `default-src 'self' 'local'; img-src 'self' data:; media-src 'self' data:; script-src 'unsafe-inline' 'self' 'local'; style-src 'unsafe-inline' 'self' 'local';`;
    const html = await fs.promises.readFile(htmlPath, 'utf8');
    const updatedHtml = html.replace(/<head>/, `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);
    await fs.promises.writeFile(htmlPath, updatedHtml);
