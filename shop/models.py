from django.db import models
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone


class Category(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)
    parent_category = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE,
                                        related_name='subcategories')

    def get_all_descendants(self):
        descendants = list(self.subcategories.all())
        for child in self.subcategories.all():
            descendants.extend(child.get_all_descendants())
        return descendants

    def __str__(self):
        return self.name


class Product(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)
    description = models.TextField(null=True)
    ingredients = models.TextField(null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def offer_price(self):
        active_offer = self.offers.filter(active=True,
                                          start_date__lte=timezone.now()).exclude(end_date__lt=timezone.now()).first()
        if active_offer:
            discounted_price = active_offer.calculate_discounted_price(self.price)
            return round(discounted_price, 2)
        return round(self.price, 2)

    def __str__(self):
        return self.name


class ProductCategory(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_categories')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='product_categories')
    category_name = models.CharField(max_length=255)

    def get_category_parents(self):
        parents = []
        category = self.category
        while category.parent_category:
            parents.append(category.parent_category)
            category = category.parent_category
        return parents

    def __str__(self):
        return f"{self.product.name} - {self.category_name}"


class NutritionalValue(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='nutritional_values')
    position = models.PositiveIntegerField(default=0)
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    def __str__(self):
        return f"Nutritional Value for {self.product.name} (Position: {self.position})"


class Rating(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings')
    title = models.CharField(max_length=255, blank=True, null=True)
    review = models.TextField(max_length=1000, blank=True, null=True)
    score = models.DecimalField(max_digits=2, decimal_places=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating {self.score} for {self.product.name} by {self.user}"

    @classmethod
    def average_score(cls, product):
        total_reviews = cls.objects.filter(product=product)
        total_score = total_reviews.aggregate(Sum('score'))['score__sum'] or 0
        total_count = total_reviews.count() or 1

        return total_score / total_count


class LikeDislike(models.Model):
    LIKE = 'like'
    DISLIKE = 'dislike'

    CHOICE = [
        (LIKE, 'Like'),
        (DISLIKE, 'Dislike')
    ]

    objects = models.Manager()
    rating = models.ForeignKey(Rating, on_delete=models.CASCADE, related_name='like_dislikes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='like_dislikes')
    choice = models.CharField(max_length=7, choices=CHOICE)

    class Meta:
        unique_together = ('rating', 'user')

    def __str__(self):
        return f"{self.user} {'liked' if self.choice == self.LIKE else 'disliked'}"


def product_picture_path(instance, filename):
    product_name = instance.product.name
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return f'product/{product_name}/product_pictures/{filename}'
    else:
        return f'shop/static/images/product/{product_name}/product_pictures/{filename}'


class ProductImage(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=product_picture_path)
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Image for {self.product.name} (Position: {self.position})"


class Cart(models.Model):
    objects = models.Manager()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    product_id = models.PositiveIntegerField()
    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.product_name}"


class Favorite(models.Model):
    objects = models.Manager()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    product_id = models.PositiveIntegerField()
    product_name = models.CharField(max_length=255)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.product_name}"


class Offer(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.CASCADE, related_name='offers')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    discount_type = models.CharField(
        max_length=20,
        choices=[
            ('percentage', 'Percentage Discount'),
            ('fixed', 'Fixed Amount Discount')
        ]
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_discounted_price(self, original_price):
        if self.discount_type == 'percentage':
            return original_price * (1 - self.discount_value / 100)
        elif self.discount_type == 'fixed':
            return max(0, original_price - self.discount_value)
        return original_price

    def __str__(self):
        return f"Offer: {self.title}"


class Coupon(models.Model):
    objects = models.Manager()
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(
        max_length=20,
        choices=[('percentage', 'Percentage Discount'), ('fixed', 'Fixed Amount Discount')]
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    usage_limit = models.PositiveIntegerField()
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.CASCADE, related_name='coupons')
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.CASCADE, related_name='coupons')

    def apply_discount(self, original_price, product=None):
        if self.product and product and self.product != product:
            return original_price
        if self.category and product:
            product_categories = product.product_categories.all()
            if not any(pc.category == self.category for pc in product_categories):
                return original_price

        if self.discount_type == 'percentage':
            return original_price * (1 - self.discount_value / 100)
        elif self.discount_type == 'fixed':
            return max(0, original_price - self.discount_value)
        return original_price

    def __str__(self):
        return f"Coupon: {self.code}"


class ProductStats(models.Model):
    class Meta:
        verbose_name_plural = "Product Statistics"
        managed = False
