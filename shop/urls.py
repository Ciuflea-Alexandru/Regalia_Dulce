from django.urls import path
from . import views

urlpatterns = [
    path('home/', views.home, name='home'),
    path('product/<int:product_id>/', views.product, name='product'),
    path('category/<str:category_name>/', views.category, name='category'),
    path('cart/', views.cart, name='cart'),
    path('favorites/', views.favorites, name='favorites'),
    path('add_product/', views.add_product, name='add_product'),
    path('search/', views.search, name='search'),
    path('create-checkout-session/', views.create_checkout_session, name='create_checkout_session'),
    path('payment/success/', views.payment_success, name='payment_success'),
    path('story/', views.story, name='story'),
    path('mission/', views.mission, name='mission'),
]
