from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('verify_code/', views.verify_code, name='verify_code'),
    path('account/', views.account_page, name='account_page'),
]
