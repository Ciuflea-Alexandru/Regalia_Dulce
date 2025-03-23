import json
import base64
from django.shortcuts import render, redirect, get_object_or_404
from django.db import transaction
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect
from .models import Category, SubCategory, ProductFamily, Product, ProductImage, Specification, Feature
from django.core.files.base import ContentFile
from django.http import JsonResponse


@csrf_protect
def product(request, product_id):
    product_instance = get_object_or_404(Product, pk=product_id)
    family_branch = product_instance.family_branch

    def get_all_subfamilies(family):
        subfamilies = family.child_families.all()
        all_subfamilies = [family]
        for subfamily in subfamilies:
            all_subfamilies.extend(get_all_subfamilies(subfamily))
        return all_subfamilies

    subfamilies = get_all_subfamilies(family_branch)

    def get_differing_spec(other_product):
        selected_specs = {spec.column1: spec.column2 for spec in product_instance.specifications.all()}
        other_specs = {spec.column1: spec.column2 for spec in other_product.specifications.all()}
        differing_specs = {}
        for key in selected_specs:
            if selected_specs.get(key) != other_specs.get(key):
                differing_specs[key] = (selected_specs[key], other_specs.get(key))
        return differing_specs

    def product_specifications(products):
        filtered = []
        for product in products:
            differing_specs = get_differing_spec(product)
            if len(differing_specs) == 1:
                filtered.append((product, differing_specs))
        return filtered

    # Add differing keys to the context
    subfamily_products = {}
    for subfamily in subfamilies:
        products_with_specs = product_specifications(subfamily.products.all())
        if products_with_specs:
            first_product, differing_specs = products_with_specs[0]
            differing_key = list(differing_specs.keys())[0] if differing_specs else subfamily.name
            subfamily_products[subfamily] = {
                'products': products_with_specs,
                'differing_key': differing_key
            }

    for subfamily, data in subfamily_products.items():
        products = data['products']
        product_list = [p[0] for p in products]  # Extract product objects

        if product_instance not in product_list:
            _, first_differing_spec = products[0]  # Get a reference differing spec
            products.append(
                (product_instance, {key: (value[0], value[0]) for key, value in first_differing_spec.items()}))

        # Sort products naturally based on hierarchy/order (keeping them in order)
        data['products'] = sorted(products, key=lambda p: (p[0].family.position, p[0].position))

    subfamily_products = dict(sorted(subfamily_products.items(), key=lambda item: item[1]['differing_key']))

    def get_different_family_branch_products():
        filtered_products = {}
        for product in Product.objects.exclude(family_branch=family_branch):
            differing_specs = get_differing_spec(product)
            if len(differing_specs) == 1:
                differing_key = list(differing_specs.keys())[0]
                if differing_key not in filtered_products:
                    filtered_products[differing_key] = []
                filtered_products[differing_key].append((product, differing_specs))
        return filtered_products

    different_subfamily_products = get_different_family_branch_products()

    for differing_key, products in different_subfamily_products.items():
        product_list = [p[0] for p in products]  # Extract product objects

        if product_instance not in product_list:
            first_product, first_differing_spec = products[0]  # Get first product's differing spec
            products.append(
                (product_instance, {key: (value[0], value[0]) for key, value in first_differing_spec.items()})
            )

        # Sort products naturally without prioritizing the selected product
        different_subfamily_products[differing_key] = sorted(products,
                                                             key=lambda p: (p[0].family.position, p[0].position))

    context = {
        'product': product_instance,
        'subfamily_products': subfamily_products,
        'different_subfamily_products': different_subfamily_products,
    }

    return render(request, 'product.html', context)


@csrf_protect
@login_required
@transaction.atomic
def add_product_family(request):
    if request.method == 'POST':
        try:
            # Extract the product family data from the request
            product_family_data = request.POST.get('product_family_data')
            if not product_family_data:
                messages.error(request, 'Product family data is required.')
                return redirect('add_product_family')

            entities = json.loads(product_family_data)
            print("Entities Received:", entities)

            # Sort the entities by their hierarchical IDs
            sorted_entities = sorted(entities.items(), key=lambda x: list(map(float, x[0].split('.'))))
            subfamily_count = 0  # Track the number of subfamilies
            product_count = 0  # Track the number of products
            validation_errors = []
            existing_names = set()

            # First pass: Validate entities and check counts
            for entity_id, entity_data in sorted_entities:
                entity_type = entity_data.get("type", "")
                name = entity_data.get("name", "")
                category = entity_data.get("category_subcategory", "")
                base64_images = entity_data.get("images", [])

                # Validation: Ensure all required fields are present and not empty
                if not entity_type or not name or not category:
                    validation_errors.append(
                        f"All fields (type, name, and category) are required for {name}.")

                # Ensure at least 5 product images for products
                if entity_type == "product" and len(base64_images) < 5:
                    validation_errors.append(f"At least 5 images are required for product {name}.")

                # Check for duplicate names
                if name in existing_names:
                    validation_errors.append(f"Duplicate name found: {name}.")
                existing_names.add(name)

                # Count subfamilies and products
                if entity_type == "family":
                    subfamily_count += 1
                elif entity_type == "product":
                    product_count += 1

            # After validating all entities, check for global errors
            if subfamily_count < 1:
                validation_errors.append('You must create at least one subfamily.')

            if product_count < 2:
                validation_errors.append('You must create at least two products.')

            # If there are validation errors, display them and redirect
            if validation_errors:
                for error in validation_errors:
                    messages.error(request, error)
                return redirect('add_product_family')

            # Proceed with the creation only if validation passes
            for entity_id, entity_data in sorted_entities:
                entity_type = entity_data.get("type", "")
                name = entity_data.get("name", "")
                ship = entity_data.get("ship", "")
                category = entity_data.get("category_subcategory", "")
                specifications = entity_data.get("specifications", [])
                base64_images = entity_data.get("images", [])

                # Extract position from the hierarchical ID
                position = int(entity_id.split('.')[-1])

                # Process the root family
                if entity_type == "root":
                    # Handle category and subcategories for the root family
                    category_name, *subcategory_names = category.split('/')
                    try:
                        category = Category.objects.get(name=category_name)
                    except Category.DoesNotExist:
                        messages.error(request, f'Category not found: {category_name}.')
                        return redirect('add_product_family')
                    subcategories = SubCategory.objects.filter(name__in=subcategory_names)

                    # Create or update the root family using defaults
                    root_family, created = ProductFamily.objects.update_or_create(
                        owner=request.user,
                        parent_family=None,
                        name=name,
                        defaults={
                            "category": category,
                            "position": position,
                            "root_family": None,
                            "family_branch": None  # Root family has no parent, so no family branch
                        }
                    )
                    # Add subcategories to the root family
                    root_family.subcategories.set(subcategories)
                    root_family.root_family = root_family  # Set root_family as itself
                    root_family.save()
                    print(f"Root Family Created: {name}")

                # Process subfamilies
                elif entity_type == "family":
                    parent_family_id = ".".join(entity_id.split(".")[:-1])  # Extract parent family ID
                    parent_family_data = entities.get(parent_family_id, {})
                    parent_family_name = parent_family_data.get("name", "")

                    # Validate parent family existence
                    parent_family = ProductFamily.objects.filter(owner=request.user, name=parent_family_name).first()
                    if not parent_family:
                        messages.error(request, f'Parent family not found: {parent_family_name}.')
                        return redirect('add_product_family')

                    # Handle category and subcategories for the subfamily
                    category_name, *subcategory_names = category.split('/')
                    try:
                        category = Category.objects.get(name=category_name)
                    except Category.DoesNotExist:
                        messages.error(request, f'Category not found: {category_name}.')
                        return redirect('add_product_family')

                    subcategories = SubCategory.objects.filter(name__in=subcategory_names)

                    # Create or update the subfamily using defaults
                    subfamily, created = ProductFamily.objects.update_or_create(
                        owner=request.user,
                        parent_family=parent_family,
                        name=name,
                        defaults={
                            "category": category,
                            "position": position,
                            "root_family": parent_family.root_family or parent_family,
                        }
                    )
                    # Add subcategories to the subfamily
                    subfamily.subcategories.set(subcategories)
                    subfamily.save()
                    print(f"Subfamily Created: {name}")

                # Process products
                elif entity_type == "product":
                    parent_family_id = ".".join(entity_id.split(".")[:-1])  # Extract parent family ID
                    parent_family_data = entities.get(parent_family_id, {})
                    parent_family_name = parent_family_data.get("name", "")

                    # Validate parent family existence
                    parent_family = ProductFamily.objects.filter(owner=request.user, name=parent_family_name).first()
                    if not parent_family:
                        messages.error(request, f'Parent family not found: {parent_family_name}.')
                        return redirect('add_product_family')

                    # Handle category and subcategories for the product
                    category_name, *subcategory_names = category.split('/')
                    try:
                        category = Category.objects.get(name=category_name)
                    except Category.DoesNotExist:
                        messages.error(request, f'Category not found: {category_name}.')
                        return redirect('add_product_family')

                    subcategories = SubCategory.objects.filter(name__in=subcategory_names)

                    # Find the family branch (the family that has the root_family as parent)
                    # Find the family branch (direct parent that has root_family as its parent)
                    if parent_family.parent_family == parent_family.root_family:
                        family_branch = parent_family
                    else:
                        # Fallback: Use the closest family with the root_family as its parent
                        family_branch = ProductFamily.objects.filter(
                            owner=request.user,
                            parent_family=parent_family.root_family
                        ).first()

                    # If no family branch is found, use the root family as the default family branch
                    if not family_branch:
                        family_branch = parent_family  # Default to the parent_family itself if no branch is found

                    # Create or update the product using defaults
                    product, created = Product.objects.update_or_create(
                        owner=request.user,
                        family=parent_family,
                        name=name,
                        defaults={
                            "category": category,
                            "ship": ship,
                            "description": entity_data.get("description", ""),
                            "price": entity_data.get("price", 0),
                            "stock": entity_data.get("stock", 0),
                            "position": position,
                            "root_family": parent_family.root_family or parent_family,
                            "family_branch": family_branch  # Set the family branch as the one found above
                        }
                    )

                    # Add subcategories to the product
                    product.subcategories.set(subcategories)
                    product.save()
                    print(f"Product Created: {name}")

                    # Update or create specifications for the product
                    for spec in specifications:
                        # Check if the specification already exists
                        existing_spec = Specification.objects.filter(
                            product=product,
                            column1=spec.get("key", ""),
                            column2=spec.get("value", "")
                        ).first()

                        if existing_spec:
                            # Update existing specification
                            existing_spec.column1 = spec.get("key", "")
                            existing_spec.column2 = spec.get("value", "")
                            existing_spec.save()
                        else:
                            # Create new specification
                            Specification.objects.create(
                                product=product,
                                product_family=parent_family,  # Include product family ID
                                column1=spec.get("key", ""),
                                column2=spec.get("value", ""),
                                position=product.specifications.count() + 1
                            )

                    # Handle images for the product
                    for index, base64_image in enumerate(base64_images, start=1):
                        # Split the base64 string to remove the header (data:image/png;base64,)
                        image_data = base64_image.split(',')[1]
                        image_name = f"{product.id}_image_{index}.png"  # Create a name for the image

                        # Check if the image already exists for this product (based on the image data)
                        existing_images = ProductImage.objects.filter(product=product, product_family=parent_family)
                        image_exists = False

                        for existing_image in existing_images:
                            # Compare the base64 image data (you may use a hash to speed up comparison)
                            if base64.b64encode(existing_image.image.read()).decode('utf-8') == image_data:
                                image_exists = True
                                break

                        # If the image doesn't exist, create the new image
                        if not image_exists:
                            # Decode the image
                            image_data = base64.b64decode(image_data)
                            image_file = ContentFile(image_data, name=image_name)

                            # Create the image object and associate it with the product and product family
                            ProductImage.objects.create(
                                product=product,
                                product_family=parent_family,  # Include product family ID
                                image=image_file,
                                position=index
                            )

            messages.success(request, 'Product family created successfully!')
            return redirect('add_product_family')

        except Exception as e:
            messages.error(request, f'An error occurred: {e}')
            return redirect('add_product_family')
    # Handle GET request: Provide categories and subcategories to the frontend
    categories = Category.objects.all()
    categories_data = []
    for category in categories:
        subcategories_data = [{"id": subcategory.id, "name": subcategory.name}
                              for subcategory in category.subcategory_set.all()]
        categories_data.append({
            "id": category.id,
            "name": category.name,
            "subcategories": subcategories_data
        })
    return render(request, 'add_product_family.html', {'categories': categories_data})


@csrf_protect
@login_required
def add_product(request, product_id=None):
    categories = Category.objects.all()
    for category in categories:
        category.subcategories = category.subcategory_set.all().order_by('parent_subcategory')
    product = None
    product_subcategories = []

    if request.method == 'POST':
        # Process form data and print specific details
        name = request.POST.get('name', '')
        category = request.POST.get('category_subcategory', '')
        price = request.POST.get('price', '')
        stock = request.POST.get('stock', '')
        ship = request.POST.get('ship', '')
        description = request.POST.get('description', '')
        specifications = []
        for key in request.POST:
            if key.startswith('specification_column1'):
                index = key.split('[')[1].split(']')[0]
                spec_key = request.POST.get(f'specification_column1[{index}]', '')
                spec_value = request.POST.get(f'specification_column2[{index}]', '')
                specifications.append((spec_key, spec_value))
        features = []
        for key in request.POST:
            if key.startswith('feature_column1'):
                index = key.split('[')[1].split(']')[0]
                feature_key = request.POST.get(f'feature_column1[{index}]', '')
                feature_value = request.POST.get(f'feature_column2[{index}]', '')
                features.append((feature_key, feature_value))
        images = []
        for key in request.FILES:
            if key.startswith('images'):
                images.append(request.FILES.get(key))

        # Check if a product with the same name already exists
        if Product.objects.filter(owner=request.user, name=name).exists():
            return redirect('add_product')

        if category:
            try:
                category_name, *subcategories_names = category.split('/')
                category = Category.objects.get(name=category_name)
                subcategories = SubCategory.objects.filter(name__in=subcategories_names)

                if subcategories:
                    user_product_count = Product.objects.filter(owner=request.user).count()
                    product_position = user_product_count + 1
                    product = Product.objects.create(
                        owner=request.user,
                        category=category,
                        position=product_position,
                        name=name,
                        ship=ship,
                        price=price,
                        stock=stock,
                        description=description,
                    )
                    product.subcategories.set(subcategories)

                    # Get the parent family (if applicable)
                    parent_family = product.family  # or retrieve it if it's from elsewhere

                    # Save specifications
                    for spec_key, spec_value in specifications:
                        Specification.objects.create(
                            product=product,
                            product_family=parent_family,
                            key=spec_key,  # Use 'key' instead of 'column1'
                            value=spec_value,  # Use 'value' instead of 'column2'
                            position=product.specifications.count() + 1
                        )

                    # Save features
                    for feature_key, feature_value in features:
                        Feature.objects.create(
                            product=product,
                            product_family=parent_family,
                            key=feature_key,  # Use 'key' instead of 'column1'
                            value=feature_value,  # Use 'value' instead of 'column2'
                            position=product.features.count() + 1
                        )

                    # Save the images with the associated product and product_family
                    for i, image_file in enumerate(images):
                        ProductImage.objects.create(
                            product=product,
                            product_family=parent_family,
                            image=image_file,
                            position=i + 1
                        )

                    # After processing, redirect to avoid resubmission
                    return JsonResponse({'success': True, 'message': 'Product details received successfully'})
            except Category.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'Category not found'})
            except SubCategory.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'One or more subcategories not found'})

    context = {
        'categories': categories,
        'product': product,
        'product_subcategories': product_subcategories,
    }
    return render(request, 'add_product.html', context)



@csrf_protect
def home(request):
    return render(request, 'home.html')


@csrf_protect
def cart(request):
    return render(request, 'cart.html')
