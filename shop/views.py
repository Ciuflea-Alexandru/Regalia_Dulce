import stripe
import posthog

from django.conf import settings
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_protect
from django.core.paginator import Paginator
from django.utils import timezone
from django.http import JsonResponse
from django.contrib import messages
from .models import (Category, Product, ProductCategory, NutritionalValue,
                     ProductImage, Rating, LikeDislike, Cart, Favorite, Offer, Coupon)


stripe.api_key = settings.STRIPE_SECRET_KEY
posthog.project_api_key = settings.POSTHOG_API_KEY
posthog.host = settings.POSTHOG_HOST


@csrf_protect
def home(request):
    user = request.user if request.user.is_authenticated else None
    products = Product.objects.all()
    categories = Category.objects.prefetch_related('subcategories', 'product_categories__product').all()
    top_products = sorted(products, key=lambda product: Rating.average_score(product), reverse=True)[:5]
    user_favorite_product_ids = Favorite.objects.filter(user=user).values_list('product_id', flat=True) if user else []
    cart_product_ids = Cart.objects.filter(user=user).values_list('product_id', flat=True) if user else []

    if request.method == "POST":
        action = request.POST.get("action")
        if action:
            try:
                action_type, product_id = action.split('_', 1)
                product = Product.objects.get(id=product_id)
                if not user:
                    return redirect('sign_in')

                if action_type == "cart":
                    existing_cart_item = Cart.objects.filter(user=user, product_id=product.id).first()
                    if existing_cart_item:
                        existing_cart_item.quantity += 1
                        existing_cart_item.save()
                    else:
                        Cart.objects.create(user=user, product_id=product.id, product_name=product.name, quantity=1)
                elif action_type == "favorite":
                    if product.id in user_favorite_product_ids:
                        Favorite.objects.filter(user=user, product_id=product.id).delete()
                    else:
                        Favorite.objects.get_or_create(user=user, product_id=product.id, product_name=product.name)

                return JsonResponse({"status": "success", "message": "Action completed successfully."})
            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)
        return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)

    context = {
        'categories': categories,
        'top_products': top_products,
        'user_favorite_product_ids': user_favorite_product_ids,
        'cart_product_ids': cart_product_ids,
        'ratings': Rating.objects.filter(score__in=[4, 5]).select_related('user'),

    }
    return render(request, 'home.html', context)


@csrf_protect
def search(request):
    products = Product.objects.all()
    categories = Category.objects.prefetch_related('subcategories', 'product_categories__product').all()

    if request.method == "POST":
        action = request.POST.get("action")

        if action:
            try:
                action_type = action.split('_', 1)[0]
                if action_type == "search":
                    search_query = request.POST.get("search_query", "")
                    products = products.filter(name__icontains=search_query)

                    # PostHog capture here
                    if request.user.is_authenticated:
                        user_id = request.user.email
                    else:
                        user_id = request.session.session_key or 'anonymous'

                    posthog.capture(
                        distinct_id=user_id,
                        event='product_search',
                        properties={
                            'search_query': search_query,
                            'result_count': products.count()
                        }
                    )

                    product_data = [
                        {
                            "id": product.id,
                            "name": product.name,
                            "description": product.description,
                            "image_url": product.images.first().image.url if product.images.first() else None
                        }
                        for product in products
                    ]
                    return JsonResponse({
                        "status": "success",
                        "message": "Search completed successfully.",
                        "products": product_data
                    })

                return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)
            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)
        return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)

    context = {
        'categories': categories,
        'products': products,
    }

    return render(request, 'search.html', context)


@csrf_protect
def product(request, product_id):
    user = request.user if request.user.is_authenticated else None
    product_instance = get_object_or_404(Product, pk=product_id)
    cart_product_ids = Cart.objects.filter(user=user).values_list('product_id', flat=True)
    user_rating = Rating.objects.filter(product=product_instance, user=user).first()
    favorite_product_ids = Favorite.objects.filter(user=user).values_list('product_id', flat=True)
    average_score = Rating.average_score(product_instance)
    rating_distribution = {
        str(score): Rating.objects.filter(product=product_instance, score=score).count()
        for score in range(5, 0, -1)
    }
    total_reviews = sum(rating_distribution.values())
    rating_percentages = {
        key: (count / total_reviews) * 100 if total_reviews else 0 for key, count in rating_distribution.items()
    }
    all_ratings = Rating.objects.filter(product=product_instance).select_related('user')
    paginator = Paginator(all_ratings, 3)
    page_number = request.POST.get('page') or request.GET.get('page') or request.session.get('review_page') or 1
    request.session['review_page'] = page_number
    try:
        page_number = int(page_number)
    except (TypeError, ValueError):
        page_number = 1
    ratings_page = paginator.get_page(page_number)
    for review in ratings_page:
        review.like_count = LikeDislike.objects.filter(rating=review, choice=LikeDislike.LIKE).count()
        review.dislike_count = LikeDislike.objects.filter(rating=review, choice=LikeDislike.DISLIKE).count()
        review.user_like = LikeDislike.objects.filter(rating=review, user=user, choice=LikeDislike.LIKE).exists()
        review.user_dislike = LikeDislike.objects.filter(rating=review, user=user, choice=LikeDislike.DISLIKE).exists()

    if request.user.is_authenticated:
        user_id = request.user.email
    else:
        user_id = request.session.session_key or 'anonymous'

    posthog.capture(
        distinct_id=user_id,
        event='product_viewed',
        properties={
            'product_id': product_instance.id,
            'product_name': product_instance.name,
        }
    )

    if request.method == "POST":
        action = request.POST.get("action")
        quantity = int(request.POST.get('quantity', 1))
        if action:
            try:
                if action == "cart":
                    existing_cart_item = Cart.objects.filter(user=user, product_id=product_instance.id).first()
                    if existing_cart_item:
                        existing_cart_item.quantity += quantity
                        existing_cart_item.save()
                    else:
                        Cart.objects.create(
                            user=user,
                            product_id=product_instance.id,
                            product_name=product_instance.name,
                            quantity=quantity
                        )
                    return JsonResponse(
                        {"status": "success", "message": f"Product added to cart! Quantity: {quantity}"})
                elif action == "favorite":
                    existing_favorite = Favorite.objects.filter(user=user, product_id=product_instance.id).first()
                    if existing_favorite:
                        existing_favorite.delete()
                        return JsonResponse({"status": "success", "message": "Product removed from favorites!"})
                    else:
                        Favorite.objects.create(
                            user=user,
                            product_id=product_instance.id,
                            product_name=product_instance.name
                        )
                        return JsonResponse({"status": "success", "message": "Product added to favorites!"})
                elif action == "submit_review":
                    title = request.POST.get('title')
                    review = request.POST.get('review')
                    score = request.POST.get('score')
                    Rating.objects.create(
                        product=product_instance,
                        user=user,
                        title=title,
                        review=review,
                        score=score
                    )
                    return JsonResponse({"status": "success", "message": "Review submitted successfully!"})
                elif action == "delete_review":
                    Rating.objects.filter(product=product_instance, user=user).delete()
                    return JsonResponse({"status": "success", "message": "Review deleted successfully!"})
                elif action in ["like", "dislike"]:
                    review_id = request.POST.get("review_id")
                    rating = Rating.objects.filter(id=review_id, product=product_instance).first()
                    if rating:
                        like_dislike_instance = LikeDislike.objects.filter(rating=rating, user=user).first()
                        if action == "like":
                            if like_dislike_instance:
                                if like_dislike_instance.choice == LikeDislike.LIKE:
                                    like_dislike_instance.delete()
                                else:
                                    like_dislike_instance.choice = LikeDislike.LIKE
                                    like_dislike_instance.save()
                            else:
                                LikeDislike.objects.create(rating=rating, user=user, choice=LikeDislike.LIKE)
                        elif action == "dislike":
                            if like_dislike_instance:
                                if like_dislike_instance.choice == LikeDislike.DISLIKE:
                                    like_dislike_instance.delete()
                                else:
                                    like_dislike_instance.choice = LikeDislike.DISLIKE
                                    like_dislike_instance.save()
                            else:
                                LikeDislike.objects.create(rating=rating, user=user, choice=LikeDislike.DISLIKE)
                        return JsonResponse({"status": "success"})
                    else:
                        return JsonResponse({"status": "error", "message": "Review not found."}, status=404)
                else:
                    return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)
            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)

    review_data = {
        'average_score': average_score,
        'user_rating': user_rating,
        'ratings': ratings_page,
        'rating_distribution': rating_distribution,
        'rating_percentages': rating_percentages,
        'average_star_rating': get_star_rating(average_score),
        'user_star_rating': get_star_rating(user_rating.score) if user_rating else None,
    }

    context = {
        'product': product_instance,
        'cart_product_ids': cart_product_ids,
        'favorite_product_ids': favorite_product_ids,
        'review_data': review_data,
        'add_quantity': 1
    }

    return render(request, 'product.html', context)


def category(request, category_name):
    user = request.user if request.user.is_authenticated else None
    category = get_object_or_404(Category, name=category_name)
    all_categories = [category] + category.get_all_descendants()
    product_categories = ProductCategory.objects.filter(category__in=all_categories).select_related('product')
    products = [pc.product for pc in product_categories]
    user_favorite_product_ids = Favorite.objects.filter(user=user).values_list('product_id', flat=True) if user else []
    cart_product_ids = Cart.objects.filter(user=user).values_list('product_id', flat=True) if user else []

    if request.method == "POST":
        action = request.POST.get("action")
        if action:
            try:
                action_type, product_id = action.split('_', 1)
                product = Product.objects.get(id=product_id)
                if not user:
                    return redirect('sign_in')

                if action_type == "cart":
                    existing_cart_item = Cart.objects.filter(user=user, product_id=product.id).first()
                    if existing_cart_item:
                        existing_cart_item.quantity += 1
                        existing_cart_item.save()
                    else:
                        Cart.objects.create(user=user, product_id=product.id, product_name=product.name, quantity=1)
                elif action_type == "favorite":
                    if product.id in user_favorite_product_ids:
                        Favorite.objects.filter(user=user, product_id=product.id).delete()
                    else:
                        Favorite.objects.get_or_create(user=user, product_id=product.id, product_name=product.name)

                return JsonResponse({"status": "success", "message": "Action completed successfully."})
            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)
        return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)

    context = {
        'category': category,
        'category_name': category.name.replace('_', ' '),
        'products': products,
        'user_favorite_product_ids': user_favorite_product_ids,
        'cart_product_ids': cart_product_ids,
    }

    return render(request, 'category.html', context)


@csrf_protect
@login_required
def cart(request):
    user = request.user
    user_favorite_product_ids = Favorite.objects.filter(user=user).values_list('product_id', flat=True)
    cart_items = Cart.objects.filter(user=user)
    sub_total = 0
    products_in_cart = []
    has_available_items = False

    if request.method == "POST":
        action = request.POST.get("action")
        coupon_code = request.POST.get("coupon_code")

        if action:
            try:
                action_type, product_id = action.split('_', 1)
                product = Product.objects.get(id=product_id)

                if action_type == "increase":
                    cart_item, created = Cart.objects.get_or_create(user=user, product_id=product.id)
                    if cart_item.quantity < product.stock:
                        cart_item.quantity += 1
                        cart_item.save()
                    else:
                        messages.success(request, 'Cannot add more than available stock', extra_tags='cart')
                        return JsonResponse({"status": "error", "message": "Cannot add more than available stock."})

                elif action_type == "decrease":
                    cart_item = Cart.objects.get(user=user, product_id=product.id)
                    cart_item.quantity = max(1, cart_item.quantity - 1)
                    cart_item.save()

                elif action_type == "delete":
                    Cart.objects.filter(user=user, product_id=product.id).delete()

                elif action_type == "favorite":
                    if product.id in user_favorite_product_ids:
                        Favorite.objects.filter(user=user, product_id=product.id).delete()
                    else:
                        Favorite.objects.get_or_create(user=user, product_id=product.id, product_name=product.name)

                return JsonResponse({"status": "success", "message": "Action completed successfully."})

            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)

        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, start_date__lte=timezone.now())

                if coupon.end_date and coupon.end_date < timezone.now():
                    messages.success(request, 'Coupon has expired', extra_tags='cart')
                request.session['coupon_code'] = coupon_code
                messages.success(request, 'Coupon  applied!', extra_tags='cart')

            except Coupon.DoesNotExist:
                messages.success(request, 'Coupon not found', extra_tags='cart')

        return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)

    if 'coupon_code' in request.session:
        coupon_code = request.session['coupon_code']
        del request.session['coupon_code']
    else:
        coupon_code = None

    coupon = Coupon.objects.filter(code=coupon_code).first() if coupon_code else None

    for item in cart_items:
        product = Product.objects.get(id=item.product_id)
        if product.stock > 0:
            if coupon:
                if coupon.product == product:
                    product_price = coupon.apply_discount(product.price, product)
                elif coupon.category:
                    product_categories = product.product_categories.all()
                    if coupon.category in [pc.category for pc in product_categories]:
                        product_price = coupon.apply_discount(product.price, product)
                    else:
                        product_price = product.offer_price if product.offer_price != product.price else product.price
                else:
                    product_price = product.offer_price if product.offer_price != product.price else product.price
            else:
                product_price = product.offer_price if product.offer_price != product.price else product.price

            sub_total_product = item.quantity * product_price
            sub_total += sub_total_product
            has_available_items = True
        else:
            sub_total_product = 0

        products_in_cart.append({
            'product': product,
            'quantity': item.quantity,
            'sub_total_product': round(sub_total_product, 2),
            'available_quantity': product.stock,
            'product_price': product_price
        })

    transport_fee = 5 if sub_total > 0 else 0
    total = sub_total + transport_fee
    request.session['coupon'] = coupon_code

    context = {
        'products_in_cart': products_in_cart,
        'user_favorite_product_ids': user_favorite_product_ids,
        'sub_total': round(sub_total, 2),
        'transport_fee': transport_fee,
        'total': round(total, 2),
        'has_available_items': has_available_items,
    }
    return render(request, 'cart.html', context)


@login_required
def create_checkout_session(request):
    user = request.user
    cart_items = Cart.objects.filter(user=user)
    line_items = []
    sub_total = 0
    transport_fee = 5
    coupon = None

    coupon_code = request.session.get('coupon')
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code, start_date__lte=timezone.now())
            if coupon.end_date and coupon.end_date < timezone.now():
                coupon = None
        except Coupon.DoesNotExist:
            coupon = None

    for item in cart_items:
        try:
            product = Product.objects.get(id=item.product_id)
        except Product.DoesNotExist:
            continue

        if product.stock <= 0:
            continue

        offer = Offer.objects.filter(product=product, active=True).first()
        product_price = offer.calculate_discounted_price(product.price) if offer else product.price

        if coupon:
            if coupon.product == product:
                product_price = coupon.apply_discount(product_price, product)
            elif coupon.category:
                if any(pc.category == coupon.category for pc in product.product_categories.all()):
                    product_price = coupon.apply_discount(product_price, product)

        sub_total_product = item.quantity * product_price
        sub_total += sub_total_product

        line_items.append({
            'price_data': {
                'currency': 'usd',
                'unit_amount': int(product_price * 100),
                'product_data': {
                    'name': product.name,
                },
            },
            'quantity': item.quantity,
        })

    # Add transport fee
    line_items.append({
        'price_data': {
            'currency': 'usd',
            'unit_amount': transport_fee * 100,
            'product_data': {
                'name': 'Transport Fee',
            },
        },
        'quantity': 1,
    })

    session = stripe.checkout.Session.create(
        locale='en',
        shipping_address_collection={"allowed_countries": ["US"]},
        payment_method_types=['card'],
        line_items=line_items,
        mode='payment',
        success_url=request.build_absolute_uri(reverse('payment_success')),
        cancel_url=request.build_absolute_uri(reverse('cart'))
    )

    return redirect(session.url, code=303)


@login_required
def payment_success(request):
    user = request.user
    cart_items = Cart.objects.filter(user=user)

    coupon_code = request.session.pop('coupon', None)
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code, start_date__lte=timezone.now())
            if coupon.end_date is None or coupon.end_date >= timezone.now():
                coupon.usage_limit = max(0, coupon.usage_limit - 1)
                coupon.save()
        except Coupon.DoesNotExist:
            pass

    for item in cart_items:
        try:
            product = Product.objects.get(id=item.product_id)
            product.stock = max(0, product.stock - item.quantity)
            product.save()
        except Product.DoesNotExist:
            pass

    cart_items.delete()

    return render(request, 'payment_success.html')


@csrf_protect
@login_required
def favorites(request):
    user = request.user
    cart_product_ids = Cart.objects.filter(user=user).values_list('product_id', flat=True)

    if request.method == "POST":
        action = request.POST.get("action")
        if action:
            try:
                action_type, product_id = action.split('_', 1)
                product = Product.objects.get(id=product_id)
                if action_type == "delete":
                    Favorite.objects.filter(user=user, product_id=product.id).delete()
                elif action_type == "cart":
                    existing_cart_item = Cart.objects.filter(user=user, product_id=product.id).first()
                    if existing_cart_item:
                        existing_cart_item.quantity += 1
                        existing_cart_item.save()
                    else:
                        Cart.objects.create(user=user, product_id=product.id, product_name=product.name, quantity=1)

                return JsonResponse({"status": "success", "message": "Action completed successfully."})
            except Product.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Product not found"}, status=404)
        return JsonResponse({"status": "error", "message": "Invalid action"}, status=400)

    favorite_items = Favorite.objects.filter(user=user)
    favorite_products = []

    for item in favorite_items:
        product = Product.objects.get(id=item.product_id)
        average_score = Rating.average_score(product)

        favorite_products.append({
            'product': product,
            'average_score': average_score,
            'star_rating': get_star_rating(average_score),
        })

    context = {
        'favorite_products': favorite_products,
        'cart_product_ids': cart_product_ids,
    }

    return render(request, 'favorites.html', context)


def get_star_rating(score):
    full_stars = int(score)
    half_star = 1 if (score - full_stars) >= 0.5 else 0
    empty_stars = 5 - full_stars - half_star

    stars_html = '<i class="fa-solid fa-star"></i>' * full_stars
    if half_star:
        stars_html += '<i class="fa-solid fa-star-half-stroke"></i>'
    stars_html += '<i class="fa-regular fa-star"></i>' * empty_stars

    return stars_html


@csrf_protect
@login_required
def add_product(request, product_id=None):
    product_categories = Category.objects.filter(subcategories__isnull=True)
    product = None

    if request.method == 'POST':
        name = request.POST.get('name', '')
        category = request.POST.getlist('category')
        price = request.POST.get('price', '')
        stock = request.POST.get('stock', '')
        ship = request.POST.get('ship', '')
        description = request.POST.get('description', '')
        ingredients = request.POST.get('ingredients', '')

        nutritional_values = []
        for key in request.POST:
            if key.startswith('nutritional_value_column1'):
                index = key.split('[')[1].split(']')[0]
                nutritional_key = request.POST.get(f'nutritional_value_column1[{index}]', '')
                nutritional_value = request.POST.get(f'nutritional_value_column2[{index}]', '')
                nutritional_values.append((nutritional_key, nutritional_value))

        images = []
        for key in request.FILES:
            if key.startswith('images'):
                images.append(request.FILES.get(key))

        try:
            categories = Category.objects.filter(id__in=category)
            if categories.exists():
                if Product.objects.filter(name=name).exists():
                    return JsonResponse({'success': False, 'message': 'Product with this name already exists.'})

                product = Product.objects.create(
                    position=Product.objects.count() + 1,
                    name=name,
                    ship=ship,
                    price=price,
                    stock=stock,
                    description=description,
                    ingredients=ingredients,
                )

                for category in categories:
                    ProductCategory.objects.create(product=product, category=category, category_name=category.name)

                for nutritional_key, nutritional_value in nutritional_values:
                    NutritionalValue.objects.create(
                        product=product,
                        key=nutritional_key,
                        value=nutritional_value,
                        position=product.nutritional_values.count() + 1
                    )

                for i, image_file in enumerate(images):
                    ProductImage.objects.create(
                        product=product,
                        image=image_file,
                        position=i + 1
                    )

                return JsonResponse({'success': True, 'message': 'Product added successfully!'})

        except Exception as e:
            return JsonResponse({'success': False, 'message': f'An error occurred: {e}'})

    context = {
        'product_categories': product_categories,
        'product': product,
    }
    return render(request, 'add_product.html', context)


@csrf_protect
def story(request):
    return render(request, 'story.html')


@csrf_protect
def mission(request):
    return render(request, 'mission.html')
