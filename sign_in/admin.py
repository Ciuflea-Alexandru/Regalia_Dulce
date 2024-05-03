from django import forms
from django.contrib import admin
from .models import EmailConfiguration


class EmailConfigurationAdminForm(forms.ModelForm):
    class Meta:
        model = EmailConfiguration
        fields = '__all__'

    def clean(self):
        if EmailConfiguration.objects.exists() and self.instance.pk is None:
            raise forms.ValidationError("Only one instance of EmailConfiguration is allowed.")
        return super().clean()


@admin.register(EmailConfiguration)
class EmailConfigurationAdmin(admin.ModelAdmin):
    form = EmailConfigurationAdminForm
    list_display = ('email_host_user', 'email_host', 'email_port', 'email_use_tls')
    fieldsets = (
        (None, {
            'fields': (
                'email_backend', 'email_host', 'email_port', 'email_use_tls', 'email_host_user', 'email_host_password')
        }),
    )

    def has_add_permission(self, request):
        if EmailConfiguration.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
