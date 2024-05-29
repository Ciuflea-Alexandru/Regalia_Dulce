import os

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.shortcuts import render
from django.utils.crypto import get_random_string
from django.views.decorators.csrf import csrf_protect
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.contrib import messages

from .forms import SignUpForm, ProfilePictureForm
from .models import DatabaseConfiguration, EmailConfiguration, VerificationCode


@csrf_protect
def signup(request):
    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.is_active = False
            user.save()

            verification_code = get_random_string(length=6)
            VerificationCode.objects.create(user=user, code=verification_code)

            send_mail(
                'Verification Code',
                f'Your verification code is: {verification_code}',
                'EMAIL_HOST_USER',
                [user.email],
                fail_silently=False,
            )

            return redirect('verify_code')
    else:
        form = SignUpForm()
    return render(request, 'Sign_Up.html', {'form': form})

@csrf_protect
def verify_code(request):
    if request.method == 'POST':
        entered_code = request.POST.get('code')

        if not entered_code:
            messages.error(request, 'Please enter a verification code.')
            return render(request, 'Verify_Code.html')

        verification_code = VerificationCode.objects.filter(code=entered_code).last()

        if verification_code is None:
            messages.error(request, 'Invalid verification code.')
            return render(request, 'Verify_Code.html')

        if verification_code.expired():
            verification_code.delete()
            messages.error(request, 'Verification code has expired.')
            return render(request, 'Verify_Code.html')

        user = verification_code.user
        verification_code.delete()
        user.is_active = True
        user.save()

        messages.success(request, 'Your account has been verified successfully. You can now log in.')
        return redirect('signin')

    return render(request, 'Verify_Code.html')


@csrf_protect
def signin(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('account_page')
        else:
            messages.error(request, 'Invalid username or password')

    return render(request, 'Sign_In.html')


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
