from django.urls import path
from . import views


urlpatterns = [
    path('account/', views.account_page, name='account_page'),
    ]
