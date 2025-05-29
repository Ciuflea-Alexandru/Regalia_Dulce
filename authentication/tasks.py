from authentication.models import Person, VerificationCode
from django.utils import timezone


def delete_inactive_users():
    users_to_delete = Person.objects.filter(active=False)
    users_to_delete.delete()


def delete_expired_verification_codes():
    expired_codes = VerificationCode.objects.filter(end_date__lt=timezone.now())
    expired_codes.delete()
