import os
from uuid import uuid4
from django.conf import settings
from django.contrib.auth.forms import UserCreationForm
from django import forms
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

        # If the form is bound to an existing instance, delete the old image file
        if person.pk:
            old_profile_picture = Person.objects.get(pk=person.pk).profile_picture
            if old_profile_picture:
                # Delete the old profile picture file from the storage
                os.remove(os.path.join(settings.MEDIA_ROOT, str(old_profile_picture)))

        # Generate a unique filename for the new profile picture
        filename = str(uuid4()) + os.path.splitext(self.cleaned_data['profile_picture'].name)[-1]
        person.profile_picture.name = os.path.join('profile_pictures', filename)

        if commit:
            person.save()

        return person
