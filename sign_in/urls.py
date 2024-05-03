from django.urls import path
from . import views


urlpatterns = [
    path('signin/', views.signin, name='signin'),
    path('verify_code/', views.verify_code, name='verify_code'),
]
