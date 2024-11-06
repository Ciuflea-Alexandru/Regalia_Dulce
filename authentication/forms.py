import os

from django.contrib.auth.forms import UserCreationForm
from django import forms

from my_site import settings
from .models import Person


class SignUpForm(UserCreationForm):
    password2 = forms.CharField(widget=forms.PasswordInput, label='Confirm Password')

    class Meta:
        model = Person
        fields = ['username', 'email', 'password1', ]

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords must be the same.")

        return password2


class ProfilePictureForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = ['profile_picture']

    def save(self, commit=True):
        person = super(ProfilePictureForm, self).save(commit=False)

        new_profile_picture = self.cleaned_data.get('profile_picture')
        if new_profile_picture:
            # Rename the picture to profile_picture.jpg
            new_profile_picture.name = 'profile_picture.jpg'

            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                person.profile_picture = new_profile_picture
            else:
                # Save to local folder (with folder creation)
                filename, _ = os.path.splitext(new_profile_picture.name)  # Separate filename (already renamed)
                user_folder = os.path.join(f'authentication/static/images/profile_pictures/{person.id}')  # Create user folder path

                # Check if folder exists, create it if not
                if not os.path.exists(user_folder):
                    os.makedirs(user_folder)

                filepath = os.path.join(user_folder, new_profile_picture.name)

                with open(filepath, 'wb') as destination:
                    for chunk in new_profile_picture.chunks():
                        destination.write(chunk)
                person.profile_picture = filepath

        if commit:
            person.save()

        return person


class UserUpdateForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = ['username', 'email']


class ProfileUpdateForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = ['first_name', 'last_name', 'country', 'gender']
