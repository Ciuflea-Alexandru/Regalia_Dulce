from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone


class Person(AbstractUser):
    email = models.EmailField(unique=True)
    authenticated = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return self.username


class VerificationCode(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)

    # Only works with self.created_at
    def expired(self):
        expiration_period = timedelta(minutes=1)
        expiration_time = self.created_at + expiration_period
        return timezone.now() > expiration_time


class DatabaseConfiguration(models.Model):

    engine = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    user = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.CharField(max_length=100)

    def __str__(self):
        return 'Database Configuration'


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
