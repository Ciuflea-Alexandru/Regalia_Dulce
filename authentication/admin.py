from django.contrib import admin
from django.contrib.auth.models import Group
from django import forms
from .models import Person, DatabaseConfiguration, EmailConfiguration, AWSConfiguration


from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Person, VerificationCode


class PersonAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'authenticated', 'active', 'last_login', 'date_joined')
    list_filter = ('authenticated', 'active', 'gender', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fields = ('username', 'first_name', 'last_name', 'email', 'gender', 'country', 'authenticated', 'active', 'profile_picture', 'date_joined', 'last_login', 'groups')
    readonly_fields = ('email', 'last_login', 'date_joined')

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'groups':
            kwargs['queryset'] = Group.objects.all()
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    def has_add_permission(self, request):
        return request.user.is_superuser

    def save_model(self, request, obj, form, change):
        obj.save()
        super().save_model(request, obj, form, change)


class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'end_date', 'expired')
    list_filter = ('created_at', 'end_date')
    search_fields = ('user__username', 'code')
    readonly_fields = ('created_at', 'end_date')

    def expired(self, obj):
        return obj.expired()
    expired.boolean = True
    expired.short_description = 'Expired'


admin.site.register(Person, PersonAdmin)
admin.site.register(VerificationCode, VerificationCodeAdmin)


@admin.register(DatabaseConfiguration)
class DatabaseConfigurationAdmin(admin.ModelAdmin):
    list_display = ('engine', 'name', 'password', 'user', 'host', 'port')
    search_fields = ('name', 'user', 'host')

    def has_add_permission(self, request):
        if DatabaseConfiguration.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False


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


@admin.register(AWSConfiguration)
class AWSConfigurationAdmin(admin.ModelAdmin):
    list_display = ('access_key_id', 'storage_bucket_name', 's3_file_overwrite')
    fieldsets = (
        (None, {
            'fields': ('access_key_id', 'secret_access_key',
                       'storage_bucket_name', 's3_file_overwrite', 'default_file_storage')
        }),
    )

    def has_add_permission(self, request):
        if AWSConfiguration.objects.exists():
            return False
        return super().has_add_permission(request)

    def has_delete_permission(self, request, obj=None):
        return False
