from django.db import models
from django.contrib.auth.models import AbstractUser


class Person(AbstractUser):
    email = models.EmailField(unique=True)
    authenticated = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)

    def __str__(self):
        return self.username


class DatabaseConfiguration(models.Model):

    engine = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    user = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    host = models.CharField(max_length=100)
    port = models.CharField(max_length=100)

    def __str__(self):
        return 'Database Configuration'
