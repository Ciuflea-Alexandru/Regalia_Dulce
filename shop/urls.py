from django.urls import path
from . import views

urlpatterns = [
    path('home/', views.home, name='home'),
    path('product/<int:product_id>/', views.product, name='product'),
    path('cart/', views.cart, name='cart'),
    path('add_product/', views.add_product, name='add_product'),
    # path('add_product/<int:product_id>/', views.add_product, name='add_product'),
    path('add_product_family/', views.add_product_family, name='add_product_family'),
]
