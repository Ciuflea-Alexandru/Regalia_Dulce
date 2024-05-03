from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Person
from .models import DatabaseConfiguration


class PersonAdmin(admin.ModelAdmin):
    fields = ('username', 'first_name', 'last_name', 'email', 'date_joined', 'last_login', 'groups')
    readonly_fields = ('email', 'last_login', 'date_joined')

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        if db_field.name == 'groups':
            kwargs['queryset'] = Group.objects.all()
        return super().formfield_for_manytomany(db_field, request, **kwargs)

    def has_add_permission(self, request):
        return request.user.is_superuser


admin.site.register(Person, PersonAdmin)


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
