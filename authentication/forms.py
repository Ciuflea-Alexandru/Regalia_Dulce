import os
from django.conf import settings
from django.contrib.auth.forms import UserCreationForm
from django import forms
from django.utils.text import get_valid_filename
from django.core.files.storage import default_storage
from django.core.exceptions import ObjectDoesNotExist
from uuid import uuid4
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

        if person.pk:
            try:
                old_profile_picture = Person.objects.get(pk=person.pk).profile_picture
                if old_profile_picture and old_profile_picture.name:
                    old_file_path = os.path.join(settings.MEDIA_ROOT, old_profile_picture.name)
                    if default_storage.exists(old_file_path):
                        default_storage.delete(old_file_path)
            except ObjectDoesNotExist:
                pass
            except Exception as e:
                print(f"Error deleting old profile picture: {e}")

        new_profile_picture = self.cleaned_data.get('profile_picture')
        if new_profile_picture:
            extension = os.path.splitext(new_profile_picture.name)[-1]
            unique_filename = f"{uuid4()}{extension}"
            valid_filename = get_valid_filename(unique_filename)
            person.profile_picture.name = os.path.join(valid_filename)

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
