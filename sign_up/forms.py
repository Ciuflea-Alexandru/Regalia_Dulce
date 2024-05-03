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