from django.urls import path
from . import views
from . import static
from django.conf import settings

urlpatterns = [
    path('account/', views.account_page, name='account_page') ,
    ]
