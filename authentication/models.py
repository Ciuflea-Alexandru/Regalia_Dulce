from datetime import timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.utils import timezone


def profile_picture_path(instance, filename):
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return f'profile_pictures/{instance.id}/{filename}'
    else:
        return f'authentication/static/images/profile_pictures/{instance.id}/{filename}'


class Person(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('N', 'None'),
    ]

    authenticated = models.BooleanField(default=False)
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(
        upload_to=profile_picture_path, default='profile_pictures/avatar.jpg')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    country = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return self.username


class VerificationCode(models.Model):
    objects = models.Manager()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)

    def expired(self):
        expiration_period = timedelta(minutes=1)
        expiration_time = self.created_at + expiration_period
        return timezone.now() > expiration_time


class DatabaseConfiguration(models.Model):
    objects = models.Manager()
    engine = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    user = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.CharField(max_length=100)

    def __str__(self):
        return 'Database Configuration'


class EmailConfiguration(models.Model):
    objects = models.Manager()
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


class AWSConfiguration(models.Model):
    objects = models.Manager()
    access_key_id = models.CharField(max_length=20)
    secret_access_key = models.CharField(max_length=40)
    storage_bucket_name = models.CharField(max_length=100)
    s3_file_overwrite = models.BooleanField(default=False)
    default_file_storage = models.CharField(max_length=100, default='storages.backends.s3boto3.S3Boto3Storage')

    def __str__(self):
        return "AWS Configuration"
