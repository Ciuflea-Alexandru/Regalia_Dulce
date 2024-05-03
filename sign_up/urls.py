from django.urls import path
from . import views

# signup/ = reprezinta numele url-ului
# views.signup = reprezinta functia signup din sign-up/views.py
# nume = nu stiu ce reprezinta sau ce face
urlpatterns = [
    path('signup/', views.signup, name='signup'),
]
