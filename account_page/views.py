from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from sign_up.forms import ProfilePictureForm

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
