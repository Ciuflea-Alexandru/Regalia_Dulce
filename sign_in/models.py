from django.db import models
from django.conf import settings
from django.utils import timezone


class VerificationCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)


class EmailConfiguration(models.Model):
    EMAIL_BACKEND_CHOICES = [
        ('django.core.mail.backends.smtp.EmailBackend', 'SMTP Backend'),
    ]

    email_backend = models.CharField(
        max_length=100, choices=EMAIL_BACKEND_CHOICES, default='django.core.mail.backends.smtp.EmailBackend')
    email_host = models.CharField(max_length=100)
    email_port = models.IntegerField()
    email_use_tls = models.BooleanField(default=True)
    email_host_user = models.EmailField()
    email_host_password = models.CharField(max_length=100)

    def __str__(self):
        return 'Email Configuration'
