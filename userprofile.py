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
