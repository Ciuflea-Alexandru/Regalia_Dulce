from django.apps import AppConfig
from django.utils.module_loading import import_string
from django.utils import timezone


class AuthenticationConfig(AppConfig):
    name = 'authentication'

    def ready(self):
        schedule = import_string('django_q.models.Schedule')

        tasks_to_schedule = [
            ('Delete_non_activated_users', 'authentication.tasks.delete_inactive_users'),
            ('Delete_expired_verification_codes', 'authentication.tasks.delete_expired_verification_codes'),
        ]

        for name, func in tasks_to_schedule:
            try:
                existing_schedule = schedule.objects.get(name=name)
                existing_schedule.next_run = timezone.now()
                existing_schedule.save()
                print(f"Updated next run time for schedule: {name} in authentication app")
            except schedule.DoesNotExist:
                if name == 'Delete_non_activated_users':
                    schedule.objects.create(
                        func='authentication.tasks.delete_inactive_users',
                        name='Delete_non_activated_users',
                        schedule_type=schedule.DAILY,
                        next_run=timezone.now()
                    )
                    print(f"Created schedule: {name} in authentication app")
                elif name == 'Delete_expired_verification_codes':
                    schedule.objects.create(
                        func='authentication.tasks.delete_expired_verification_codes',
                        name='Delete_expired_verification_codes',
                        schedule_type=schedule.DAILY,
                        next_run=timezone.now()
                    )
                    print(f"Created schedule: {name} in authentication app")