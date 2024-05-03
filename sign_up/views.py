from django.shortcuts import render, redirect
from .forms import SignUpForm
from django.views.decorators.csrf import csrf_protect
from django.dispatch import receiver
from .models import DatabaseConfiguration
import os
from django.conf import settings
from django.db.models.signals import post_save


@csrf_protect
def signup(request, ):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user_data = form.cleaned_data
            form.save()
            return redirect('signin')
    else:
        form = SignUpForm()
    return render(request, 'Sign_Up.html', {'form': form})


@receiver(post_save, sender=DatabaseConfiguration)
def update_env_file(instance, **kwargs):
    env_file_path = os.path.join(settings.BASE_DIR, '.env')
    with open(env_file_path, 'r') as env_file:
        lines = env_file.readlines()

    with open(env_file_path, 'w') as env_file:
        for line in lines:
            key = line.split('=')[0]
            if key in ['ENGINE', 'NAME', 'USER', 'PASSWORD', 'HOST', 'PORT']:
                env_file.write(f"{key}={getattr(instance, key.lower(), '')}\n")
            else:
                env_file.write(line)
