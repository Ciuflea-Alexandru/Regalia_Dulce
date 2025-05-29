import pandas as pd

from django.contrib import admin
from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.db.models import Count, Avg
from django.urls import path
from django.template.response import TemplateResponse

from .models import (Category, Product, ProductCategory, NutritionalValue,
                     ProductImage, Rating, Offer, Coupon, ProductStats)

admin.site.site_url = 'http://127.0.0.1:8000/home/'
admin.site.site_header = 'Regalia Dulce'


class CategoryInline(admin.TabularInline):
    model = Category
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_category')
    list_filter = ('parent_category',)
    search_fields = ('name',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class NutritionalValueInline(admin.TabularInline):
    model = NutritionalValue
    extra = 1


class ProductCategoryInline(admin.TabularInline):
    model = ProductCategory
    extra = 0
    max_num = 1
    can_delete = False

    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        fields = [field for field in fields if field != 'category_name']
        return fields


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'created_at', 'get_category')
    inlines = [ProductImageInline, NutritionalValueInline, ProductCategoryInline]

    fieldsets = (
        (None, {
            'fields': ('name', 'price', 'stock', 'description', 'ingredients')
        }),
    )

    def get_category(self, obj):
        pc = obj.product_categories.first()
        return pc.category.name if pc else '-'
    get_category.short_description = 'Category'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'score', 'created_at', 'title')
    list_filter = ('product', 'score', 'created_at')
    search_fields = ('product__name', 'user__username', 'title')

    fieldsets = (
        (None, {
            'fields': ('product', 'user', 'score', 'title', 'review')
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)


@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'product', 'discount_type', 'discount_value', 'start_date', 'end_date', 'active')
    list_filter = ('discount_type', 'active', 'start_date', 'end_date')
    search_fields = ('title', 'product__name')

    fieldsets = (
        (None, {
            'fields': ('title', 'product', 'description', 'discount_type',
                       'discount_value', 'start_date', 'end_date', 'active')
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        def clean(instance):
            cleaned_data = instance.cleaned_data
            product = cleaned_data.get('product')
            start_date = cleaned_data.get('start_date')
            end_date = cleaned_data.get('end_date')

            if product:
                if Offer.objects.filter(product=product, active=True).exclude(id=obj.id if obj else None).exists():
                    raise ValidationError(f"There is already an active offer for the product '{product.name}'.")

            # Validate date range
            if start_date and end_date and start_date > end_date:
                raise ValidationError("The start date cannot be later than the end date.")

            return cleaned_data

        form.clean = clean
        return form


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_type', 'discount_value', 'usage_limit', 'product', 'category')
    search_fields = ('code', 'product__name', 'category__name')

    fieldsets = (
        (None, {
            'fields': ('code', 'discount_type', 'discount_value', 'usage_limit', 'start_date', 'end_date')
        }),
        (None, {
            'fields': ('product', 'category')
        }),
    )

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)

        def clean(instance):
            cleaned_data = instance.cleaned_data
            product = cleaned_data.get('product')
            category = cleaned_data.get('category')

            if product and category:
                raise ValidationError("A coupon can only be associated with either a product or a category, not both.")
            return cleaned_data

        form.clean = clean
        return form


@admin.register(ProductStats)
class ProductStatsAdmin(admin.ModelAdmin):

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('', self.admin_site.admin_view(self.stats_view), name='product_stats'),
            path('download/', self.admin_site.admin_view(self.download_excel), name='download_product_stats'),
        ]
        return custom_urls + urls

    def stats_view(self, request):
        products = Product.objects.annotate(
            rating_count=Count('ratings'),
            average_score=Avg('ratings__score'),
            offer_count=Count('offers')
        )

        stats = {
            'average_price': Product.objects.aggregate(avg=Avg('price'))['avg'] or 0,
            'average_stock': Product.objects.aggregate(avg=Avg('stock'))['avg'] or 0,
            'total_products': Product.objects.count(),
            'total_ratings': Rating.objects.count(),
            'average_rating': Rating.objects.aggregate(avg=Avg('score'))['avg'] or 0,
        }

        categories = Category.objects.annotate(
            num_products=Count('product_categories')
        )

        for category in categories:
            category.num_subcategories = len(category.get_all_descendants())

        context = dict(
            self.admin_site.each_context(request),
            products=products,
            stats=stats,
            categories=categories,
            title="Product Statistics"
        )
        return TemplateResponse(request, "product_statistics.html", context)

    @staticmethod
    def download_excel(request):
        products = Product.objects.annotate(
            rating_count=Count('ratings'),
            average_score=Avg('ratings__score'),
            offer_count=Count('offers')
        )

        average_price = Product.objects.aggregate(avg=Avg('price'))['avg'] or 0
        average_stock = Product.objects.aggregate(avg=Avg('stock'))['avg'] or 0

        stats = {
            'average_price': average_price,
            'average_stock': average_stock,
            'total_products': Product.objects.count(),
            'total_ratings': Rating.objects.count(),
            'average_rating': Rating.objects.aggregate(avg=Avg('score'))['avg'] or 0,
        }

        product_data = []
        for product in products:
            if product.price < average_price:
                price_tag = "Cheap"
            elif product.price > average_price:
                price_tag = "Expensive"
            else:
                price_tag = "Average"

            product_data.append({
                'Product Name': product.name,
                'Price': product.price,
                'Price Category': price_tag,
                'Stock': product.stock,
                'Ratings Count': product.rating_count,
                'Average Score': product.average_score or 0,
                'Offers Count': product.offer_count,
                'Category': product.product_categories.first().category.name if product.product_categories.exists() else 'No Category'
            })

        # Prepare data for categories
        category_data = []
        categories = Category.objects.all()
        for category in categories:
            subcategories = category.get_all_descendants()
            products_in_category = Product.objects.filter(product_categories__category=category).count()

            category_data.append({
                'Category Name': category.name,
                'Subcategories Count': len(subcategories),
                'Products Count': products_in_category
            })

        df_products = pd.DataFrame(product_data)
        df_categories = pd.DataFrame(category_data)
        summary_data = {
            'Average Price': [stats['average_price']],
            'Average Stock': [stats['average_stock']],
            'Total Products': [stats['total_products']],
            'Total Ratings': [stats['total_ratings']],
            'Average Rating': [stats['average_rating']],
        }
        df_summary = pd.DataFrame(summary_data)

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="product_statistics.xlsx"'

        with pd.ExcelWriter(response, engine='xlsxwriter') as writer:
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            df_products.to_excel(writer, sheet_name='Products', index=False)
            df_categories.to_excel(writer, sheet_name='Categories', index=False)

        return response

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False