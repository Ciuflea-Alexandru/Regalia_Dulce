from django.shortcuts import render, redirect
from .forms import SignUpForm
from django.views.decorators.csrf import csrf_protect
from django.dispatch import receiver
from .models import DatabaseConfiguration
import os
from django.conf import settings
from django.db.models.signals import post_save
from django.utils.crypto import get_random_string
from django.contrib.auth import authenticate, login
from .models import VerificationCode
from django.core.mail import send_mail
from django.contrib import messages
from .models import EmailConfiguration
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from .forms import ProfilePictureForm


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


@csrf_protect
def signin(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            user.authenticated = True
            user.save()

            user_email = user.email

            verification_code = get_random_string(length=6)

            VerificationCode.objects.create(user=user, code=verification_code)

            send_mail(
                'Verification Code',
                f'Your verification code is: {verification_code}',
                'EMAIL_HOST_USER',
                [user_email],
                fail_silently=False,
            )

            return redirect('verify_code')
        else:
            messages.error(request, 'Invalid username or email')

    return render(request, 'Sign_In.html')


@csrf_protect
def verify_code(request):
    if request.method == 'POST':
        entered_code = request.POST.get('code')
        user = None

        verification_code = VerificationCode.objects.filter(code=entered_code).last()

        if verification_code:
            user = verification_code.user
            verification_code.delete()

            # Authenticate the user
            login(request, user)

            return redirect('account_page')
        else:
            messages.error(request, 'Invalid verification code')

    return render(request, 'Verify_Code.html')


@login_required
def account_page(request):
    if request.method == 'POST':
        if 'logout' in request.POST:
            logout(request)
            return redirect('signin')
        else:
            form = ProfilePictureForm(request.POST, request.FILES, instance=request.user)
            if form.is_valid():
                form.save()
                return redirect('account_page')
    else:
        form = ProfilePictureForm(instance=request.user)

    return render(request, 'account_page.html', {'form': form})


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


@receiver(post_save, sender=EmailConfiguration)
def update_env_file(instance, **kwargs):
    env_file_path = os.path.join(settings.BASE_DIR, '.env')
    with open(env_file_path, 'r') as env_file:
        lines = env_file.readlines()

    with open(env_file_path, 'w') as env_file:
        for line in lines:
            key = line.split('=')[0]
            if key in ['EMAIL_BACKEND', 'EMAIL_HOST',
                       'EMAIL_PORT', 'EMAIL_USE_TLS', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD']:
                env_file.write(f"{key}={getattr(instance, key.lower(), '')}\n")
            else:
                env_file.write(line)
