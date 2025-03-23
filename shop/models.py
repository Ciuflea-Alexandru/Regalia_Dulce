from django.db import models
from django.conf import settings


class Category(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=255)
    parent_category = models.ForeignKey(Category, on_delete=models.CASCADE)
    parent_subcategory = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class ProductFamily(models.Model):
    objects = models.Manager()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_families')
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    subcategories = models.ManyToManyField(SubCategory, related_name='product_families', blank=True)
    name = models.CharField(max_length=255)
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Product(models.Model):
    objects = models.Manager()
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_products')
    family = models.ForeignKey(
        ProductFamily, null=True, blank=True, on_delete=models.SET_NULL, related_name='products_family')
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    subcategories = models.ManyToManyField(SubCategory, related_name='products')
    name = models.CharField(max_length=255)
    ship = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField()
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class Feature(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE,
                                related_name='features')
    product_family = models.ForeignKey(ProductFamily, on_delete=models.CASCADE,
                                       related_name='features', null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    def __str__(self):
        return (f"Futures for {self.product.name if self.product else self.product_family.name} "
                f"(Position: {self.position})")


class Specification(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE,
                                related_name='specifications')
    product_family = models.ForeignKey(ProductFamily, on_delete=models.CASCADE,
                                       related_name='specifications', null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    key = models.CharField(max_length=255)
    value = models.CharField(max_length=255)

    def __str__(self):
        return (f"Specification for {self.product.name if self.product else self.product_family.name} "
                f"(Position: {self.position})")


class Rating(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ratings')
    title = models.CharField(max_length=255, blank=True, null=True)
    score = models.DecimalField(
        max_digits=2, decimal_places=1, choices=[(x / 10, str(x / 10)) for x in range(10, 51, 5)])
    review = models.TextField(max_length=1000, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating {self.score} for {self.product.name} by {self.user}"


def product_picture_path(instance, filename):
    product_id = instance.product.id
    user_id = instance.product.owner.id
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return f'{user_id}/product/{product_id}/product_pictures/{filename}'
    else:
        return f'shop/static/images/{user_id}/product/{product_id}/product_pictures/{filename}'


class ProductImage(models.Model):
    objects = models.Manager()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', null=True, blank=True)
    product_family = models.ForeignKey(ProductFamily, on_delete=models.CASCADE,
                                       related_name='images', null=True, blank=True)
    image = models.ImageField(upload_to=product_picture_path)
    position = models.PositiveIntegerField(default=0)

    def __str__(self):
        return (f"Image for {self.product.name if self.product else self.product_family.name} "
                f"(Position: {self.position})")


def rating_image_path(instance, filename):
    product_id = instance.product.id
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        return f'product/{product_id}/product_rating_pictures/{filename}'
    else:
        return f'shop/static/images/product/{product_id}/product_pictures/{filename}'


class RatingImage(models.Model):
    objects = models.Manager()
    rating = models.ForeignKey(Rating, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to=rating_image_path, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Rating {self.rating}"
