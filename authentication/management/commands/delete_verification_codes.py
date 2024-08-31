from django.core.management.base import BaseCommand
from authentication.models import VerificationCode
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Delete expired verification codes'

    def handle(self, *args, **kwargs):
        expiration_time = timezone.now() - timedelta(minutes=1)
        deleted_count, _ = VerificationCode.objects.filter(created_at__lt=expiration_time).delete()
        self.stdout.write(f'{deleted_count} expired verification codes deleted.')
