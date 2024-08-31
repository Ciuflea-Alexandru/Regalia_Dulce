from django.core.management.base import BaseCommand
from authentication.models import Person
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Delete users who have not been activated with the verification code and were created more than a day ago'

    def handle(self, *args, **kwargs):
        inactive_date = timezone.now() - timedelta(days=1)
        non_activated_users = Person.objects.filter(is_active=False, date_joined__lte=inactive_date)
        deleted_count, _ = non_activated_users.delete()
        self.stdout.write(f'{deleted_count} non-activated users deleted.')
