 @line_magic
    def create_profile(self, parameter_s=''):
        """Create a new profile and switch to it.
        
        Usage:
            %create_profile <profile_name>
        
        This magic command will create a new profile and switch to it.
        """
        profile_name = parameter_s.strip()
        if not profile_name:
            print('Please specify a profile name.')
            return
        profile_path = os.path.join(self.shell.profile_dir.location, profile_name)
        if os.path.exists(profile_path):
            print('Profile already exists.')
            return
        os.makedirs(profile_path)
        """ProfileDir object has no attributte 'switch_profile"""
        self.shell.profile_dir.switch_profile(profile_name)
        print('Profile created.')
    
    @line_magic
    def switch_profile(self, parameter_s=''):
        """Switch to an existing profile.
        
        Usage:
            %switch_profile <profile_name>
        
        This magic command will switch to an existing profile.
        """
        profile_name = parameter_s.strip()
        if not profile_name:
            print('Please specify a profile name.')
            return
        profile_path = os.path.join(self.shell.profile_dir.location, profile_name)
        if not os.path.exists(profile_path):
            print('Profile does not exist.')
            return
        self.shell.profile_dir.switch_profile(profile_name)
        print('Profile switched.')
    
    @line_magic
    def load_profile(self, parameter_s=''):
        """Load an existing profile.
        
        Usage:
            %load_profile <profile_name>
        
        This magic command will load an existing profile.
        """
        profile_name = parameter_s.strip()
        if not profile_name:
            print('Please specify a profile name.')
            return
        profile_path = os.path.join(self.shell.profile_dir.location, profile_name)
        if not os.path.exists(profile_path):
            print('Profile does not exist.')
            return
        self.shell.profile_dir.load_profile(profile_name)
        print('Profile loaded.')
    
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
        
        
        -------------------------------------------------------------
        
        import os
import json
from IPython.core.magic import (Magics, magics_class, line_magic)


class IPythonProfile:
    def __init__(self):
        self.profiles_dir = os.path.join(os.path.expanduser("~"), ".ipython_profiles")
        self.current_profile = None
        self.profiles = {}
        self.load_profiles()

    def create_profile(self, profile_name):
        if not os.path.exists(self.profiles_dir):
            os.makedirs(self.profiles_dir)

        profile_path = os.path.join(self.profiles_dir, f"{profile_name}.json")
        if os.path.exists(profile_path):
            raise ValueError(f"Profile {profile_name} already exists")

        with open(profile_path, "w") as f:
            json.dump({}, f)

        self.profiles[profile_name] = profile_path
        self.current_profile = profile_name
        self.save_profiles()

        print(f"Created profile {profile_name}")

    def switch_profile(self, profile_name):
        if profile_name not in self.profiles:
            raise ValueError(f"Profile {profile_name} does not exist")

        self.current_profile = profile_name
        self.save_profiles()

        print(f"Switched to profile {profile_name}")

    def load_profile(self, profile_name):
        if profile_name not in self.profiles:
            raise ValueError(f"Profile {profile_name} does not exist")

        with open(self.profiles[profile_name], "r") as f:
            profile_data = json.load(f)

        for key, value in profile_data.items():
            setattr(self, key, value)

        self.current_profile = profile_name

        print(f"Loaded profile {profile_name}")

    def show_current_profile(self):
        if self.current_profile:
            print(f"Current profile: {self.current_profile}")
        else:
            print("No profile is currently selected")

    def delete_profile(self, profile_name):
        if profile_name not in self.profiles:
            raise ValueError(f"Profile {profile_name} does not exist")

        os.remove(self.profiles[profile_name])
        del self.profiles[profile_name]

        if self.current_profile == profile_name:
            self.current_profile = None
            self.save_profiles()

        print(f"Deleted profile {profile_name}")

    def load_profiles(self):
        if not os.path.exists(self.profiles_dir):
            return

        for filename in os.listdir(self.profiles_dir):
            if not filename.endswith(".json"):
                continue

            profile_name = os.path.splitext(filename)[0]
            profile_path = os.path.join(self.profiles_dir, filename)
            self.profiles[profile_name] = profile_path

    def save_profiles(self):
        profiles_data = {
            profile_name: profile_path for profile_name, profile_path in self.profiles.items()
        }

        with open(os.path.join(self.profiles_dir, "profiles.json"), "w") as f:
            json.dump(profiles_data, f)


@magics_class
class QuartzReloadMagic(Magics):

    def __init__(self, shell):
        super().__init__(shell)
        self.profile_manager = IPythonProfile()

    @line_magic
    def profile_create(self, profile_name):
        self.profile_manager.create_profile(profile_name)

    @line_magic
    def profile_switch(self, profile_name):
        self.profile_manager.switch_profile(profile_name)

    @line_magic
    def profile_load(self, profile_name):
        self.profile_manager.load_profile(profile_name)

    @line_magic
    def profile_current(self, line):
        self.profile_manager.show_current_profile()

    @line
