from django.urls import path
from . import views

urlpatterns = [
    path('Home/', views.home, name='home'),
    path('Product/', views.product, name='product'),
    path('Cart/', views.cart, name='cart'),
]
