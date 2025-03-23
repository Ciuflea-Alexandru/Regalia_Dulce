document.addEventListener('DOMContentLoaded', () => {
    const addFamilyButton = document.querySelector('.add-family');
    const addProductButton = document.querySelector('.add-product');
    const deleteButton = document.querySelector('.delete-button');
    const createProductFamilyButton = document.querySelector('.create-product-family');
    const familyList = document.querySelector('.family-list');
    const section2 = document.querySelector('.section2');
    const rootFamily = document.createElement('li');
    const rootFamilyButton = document.createElement('button');
    let selectedButton = null;
    let familyCount = 0;
    let detailsCache = {};
    let imagePreviewsCache = {};

    const saveToLocalStorage = () => {
        const data = {
            detailsCache,
            imagePreviewsCache,
            hierarchy: familyList.innerHTML,
            selectedId: selectedButton ? selectedButton.dataset.id : null,
        };
        localStorage.setItem('sellerData', JSON.stringify(data));
    };

    const loadFromLocalStorage = () => {
        const savedData = JSON.parse(localStorage.getItem('sellerData'));
        if (savedData) {
            detailsCache = savedData.detailsCache;
            imagePreviewsCache = savedData.imagePreviewsCache;
            familyList.innerHTML = savedData.hierarchy;

            initializeEventListeners();

            if (savedData.selectedId) {
                const savedButton = familyList.querySelector(`button[data-id="${savedData.selectedId}"]`);
                if (savedButton) {
                    handleSelection(savedButton);
                    const type = savedButton.classList.contains('family') ? 'family' : 'product';
                    showDetails(type, savedData.selectedId);
                    return;
                }
            }

            const rootButton = familyList.querySelector('button[data-id="1"]');
            if (rootButton) {
                handleSelection(rootButton);
                showDetails('family', '1');
            }
        }
    };

    rootFamilyButton.textContent = 'Root Family';
    rootFamilyButton.classList.add('family', 'selected');  // Ensure 'family' class is added
    rootFamilyButton.dataset.id = '1'; // Set the ID of root family to '1'
    detailsCache['1'] = {
        type: 'root', // Set the root family's type as 'family'
        specifications: [], // Initialize empty specifications for root family
    };
    rootFamilyButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleSelection(rootFamilyButton);
        showDetails('family', '1'); // Reference the root family by '1'
    });

    rootFamily.appendChild(rootFamilyButton);
    familyList.appendChild(rootFamily);
    selectedButton = rootFamilyButton;

    deleteButton.addEventListener('click', () => {
        if (selectedButton && selectedButton.dataset.id !== '1') { // Avoid deleting root family
            const parentItem = selectedButton.closest('li');
            if (parentItem) {
                const parentButton = parentItem.parentElement.closest('li')?.querySelector('button');
                const id = selectedButton.dataset.id;

                parentItem.remove();
                delete detailsCache[id];
                delete imagePreviewsCache[id]; // Remove associated image previews from cache
                section2.innerHTML = '';
                selectedButton = null;

                if (parentButton) {
                    const childList = parentButton.nextElementSibling;
                    if (!childList || childList.children.length === 0) {
                        parentButton.dataset.childType = '';
                    }
                    handleSelection(parentButton);
                    showDetails(parentButton.classList.contains('family') ? 'family' : 'product', parentButton.dataset.id);
                }

                saveToLocalStorage();
            }
        } else {
            console.error('Root family cannot be deleted.');
        }
    });

    const createButton = (text, className) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add(className);
        return button;
    };


    const handleSelection = (button) => {
        if (selectedButton) {
            selectedButton.classList.remove('selected');
            const previousListItem = selectedButton.closest('li');
            if (previousListItem) {
                previousListItem.style.listStyleType = '';
            }
        }
        button.classList.add('selected');
        const listItem = button.closest('li');
        if (listItem) {
            listItem.style.listStyleType = 'disc';
        }
        selectedButton = button;
    };

    const showDetails = (type, id) => {
        section2.innerHTML = '';
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add(type === 'family' ? 'family-details' : 'product-details');

        const isRootFamily = id === '1'; // Check if it's the root family

        // Build the category options dynamically, showing the full path
        let categoryOptions = '<option value="" disabled selected hidden>Select your category</option>';
        categories.forEach(category => {
            let categoryPath = `${category.name}/`;
            category.subcategories.forEach(subcategory => {
                categoryPath += `${subcategory.name}/`;
            });
            categoryOptions += `<option value="${categoryPath.trim()}">${categoryPath.trim()}</option>`;
        });

        detailsDiv.innerHTML = `
        <div class="category">
            <p class="category-text">Choose your product category</p>
            <select class="category-box" name="category_subcategory" id="category_subcategory">
               ${categoryOptions}
            </select>
        </div>

        <div class="name">
        <p class="name-text">Your product name</p>
            <input class="name-box" type="text" name="name" placeholder="Product name" required>
        </div>

        <div class="ship">
        <p class="ship-text">Your product shippers</p>
            <input class="ship-box" type="text" name="ship" placeholder="Shippers name" required>
        </div>

        <div class="price-stock">
        <p class="price-stock-text">Your product price</p>
        <p class="price-stock-text">Your product stock</p>

        <input class="price-stock-box" type="number" name="price" placeholder="Product Price" step="0.01" required>
        <input class="price-stock-box" type="number" name="stock" placeholder="Product Stock" required>
        </div>

        <div class="image">
            <p class="image-text">Your product Images</p>
            <label class="add-image">
                <input type="file" name="images" multiple accept="image/*" required>
                Chose Image
            </label>
            <div class="image-preview"></div>
        </div>

        <div class="description">
            <p class="description-text">Your product description</p>
            <textarea class="Textarea-Box" name="description" placeholder="Product Description"></textarea>
        </div>

        <div class="specifications">
            <p class="specifications-text">Your product specifications</p>
            <button type="button" class="add-specifications">Add row</button>
            <div class="specification"></div>
        </div>

        <div class="features">
            <p class="features-text">Your product specifications</p>
            <button type="button" class="add-features">Add row</button>
            <div class="feature"></div>
        </div>`;

        section2.appendChild(detailsDiv);

        loadDetails(type, id);
        setupImagePreview(id);
        setupSpecifications(id);
    };

    const saveDetails = (type, id) => {
        const inputs = section2.querySelectorAll('input, textarea, select');
        const details = {};

        // Preserve specifications and type
        const currentSpecifications = detailsCache[id]?.specifications || [];
        const currentType = detailsCache[id]?.type || type;

        // Save the input values
        inputs.forEach(input => {
            details[input.name] = input.value;
        });

        // Persist the `type` for every item
        details.type = currentType;

        // Re-assign the specifications to the saved details after collecting inputs
        details.specifications = currentSpecifications;

        detailsCache[id] = details;
        saveToLocalStorage();
    };


    const loadDetails = (type, id) => {
        const savedDetails = detailsCache[id];
        if (savedDetails) {
            // Ensure `type` is restored for every item
            const savedType = savedDetails.type || type;
            savedDetails.type = savedType;

            const inputs = section2.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (savedDetails[input.name]) {
                    input.value = savedDetails[input.name];
                }
            });
        }
        loadImagePreviews(id);
    };

    const setupImagePreview = (id) => {
        const imageInput = section2.querySelector('input[name="images"]');
        const imagePreview = section2.querySelector('.image-preview');
        let previewedFiles = imagePreviewsCache[id] || [];
        const maxFiles = 10;

        imageInput.addEventListener('change', function (event) {
            const files = Array.from(event.target.files);
            if (files.length === 0) return;

            files.forEach(file => {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const base64Image = e.target.result;

                    // Prevent duplicate images
                    if (!previewedFiles.includes(base64Image)) {
                        if (previewedFiles.length >= maxFiles) {
                            console.error(`You can only upload a maximum of ${maxFiles} images.`);
                            return;
                        }

                        previewedFiles.push(base64Image);
                        createImagePreview(base64Image, id);
                        imagePreviewsCache[id] = previewedFiles;
                        saveToLocalStorage();
                    }
                };

                reader.readAsDataURL(file);
            });

            // Clear file input to allow selecting the same file again
            imageInput.value = '';
        });

        // Display existing previews on reload or button switch
        loadImagePreviews(id);
    };

    const renderImagePreviews = (id) => {
        const previewContainer = section2.querySelector('.image-preview');
        previewContainer.innerHTML = ''; // Clear previous previews before re-rendering

        if (imagePreviewsCache[id]) {
            imagePreviewsCache[id].forEach(base64Image => {
                const imgContainer = document.createElement('div');
                imgContainer.classList.add('preview-image-container');

                const img = document.createElement('img');
                img.src = base64Image;
                img.style.minWidth = '100px';
                img.style.minHeight = '100px';
                img.style.maxWidth = '100px';
                img.style.maxHeight = '100px';

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'X';
                deleteButton.classList.add('delete-preview');
                deleteButton.addEventListener('click', () => {
                    // Remove image from cache and UI
                    imagePreviewsCache[id] = imagePreviewsCache[id].filter(image => image !== base64Image);
                    imgContainer.remove();
                    saveToLocalStorage();
                });

                createImagePreview(base64Image, id);
            });
        }
    };

    const createImagePreview = (base64Image, id) => {
        const previewContainer = section2.querySelector('.image-preview');
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('preview-image-container');

        const img = document.createElement('img');
        img.src = base64Image;
        img.style.minWidth = '100px';
        img.style.minHeight = '100px';
        img.style.maxWidth = '100px';
        img.style.maxHeight = '100px';

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-preview');

        deleteButton.addEventListener('click', () => {
            // Remove the image from the cache and preview
            const imageIndex = imagePreviewsCache[id].indexOf(base64Image);
            if (imageIndex !== -1) {
                imagePreviewsCache[id].splice(imageIndex, 1); // Remove from cache
            }
            imgContainer.remove(); // Remove from UI
            saveToLocalStorage(); // Persist changes in local storage
        });

        const moveLeftButton = document.createElement('button');
        moveLeftButton.textContent = '←';
        moveLeftButton.classList.add('move-left');
        moveLeftButton.addEventListener('click', () => {
            const imageIndex = imagePreviewsCache[id].indexOf(base64Image);
            if (imageIndex > 0) {
                const newIndex = imageIndex - 1;
                [imagePreviewsCache[id][imageIndex], imagePreviewsCache[id][newIndex]] =
                [imagePreviewsCache[id][newIndex], imagePreviewsCache[id][imageIndex]];
                renderImagePreviews(id); // Re-render previews
                saveToLocalStorage();
            }
        });

        const moveRightButton = document.createElement('button');
        moveRightButton.textContent = '→';
        moveRightButton.classList.add('move-right');
        moveRightButton.addEventListener('click', () => {
            const imageIndex = imagePreviewsCache[id].indexOf(base64Image);
            if (imageIndex < imagePreviewsCache[id].length - 1) {
                const newIndex = imageIndex + 1;
                [imagePreviewsCache[id][imageIndex], imagePreviewsCache[id][newIndex]] =
                [imagePreviewsCache[id][newIndex], imagePreviewsCache[id][imageIndex]];
                renderImagePreviews(id); // Re-render previews
                saveToLocalStorage();
            }
        });

        imgContainer.appendChild(img);
        imgContainer.appendChild(deleteButton);
        imgContainer.appendChild(moveLeftButton);
        imgContainer.appendChild(moveRightButton);
        previewContainer.appendChild(imgContainer);
    };

    const loadImagePreviews = (id) => {
        const previewContainer = section2.querySelector('.image-preview');
        previewContainer.innerHTML = ''; // Clear existing previews

        if (imagePreviewsCache[id]) {
            imagePreviewsCache[id].forEach(base64Image => {
                createImagePreview(base64Image, id);
            });
        }
    };

    const setupSpecifications = (id) => {
        const specificationContainer = section2.querySelector('.specification');
        const addSpecificationButton = section2.querySelector('.add-specifications');

        if (!detailsCache[id]?.specifications) {
            detailsCache[id] = {...detailsCache[id], specifications: []};
        }

        addSpecificationButton.addEventListener('click', () => {
            const newSpecification = {
                key: '',
                value: ''
            };
            detailsCache[id].specifications.push(newSpecification);
            renderSpecifications(id);
        });

        renderSpecifications(id);
    };


    const renderSpecifications = (id) => {
        const specificationContainer = section2.querySelector('.specification');
        specificationContainer.innerHTML = '';

        detailsCache[id].specifications.forEach((specification, index) => {
            const specDiv = document.createElement('div');
            specDiv.classList.add('specification-row');

            const keyInput = document.createElement('input');
            keyInput.value = specification.key;
            keyInput.classList.add('column');
            keyInput.placeholder = 'Specification Key';
            keyInput.addEventListener('input', (e) => {
                detailsCache[id].specifications[index].key = e.target.value;
                saveToLocalStorage();
            });

            const valueInput = document.createElement('input');
            valueInput.value = specification.value;
            valueInput.classList.add('column');
            valueInput.placeholder = 'Specification Value';
            valueInput.addEventListener('input', (e) => {
                detailsCache[id].specifications[index].value = e.target.value;
                saveToLocalStorage();
            });

            const deleteSpecButton = document.createElement('button');
            deleteSpecButton.textContent = 'X';
            deleteSpecButton.classList.add('delete-specifications');
            deleteSpecButton.addEventListener('click', () => {
                detailsCache[id].specifications.splice(index, 1);
                renderSpecifications(id);
                saveToLocalStorage();
            });

            specDiv.appendChild(keyInput);
            specDiv.appendChild(valueInput);
            specDiv.appendChild(deleteSpecButton);

            specificationContainer.appendChild(specDiv);
        });
    };

    section2.addEventListener('input', (event) => {
        // Check if the input event is coming from an image input or specification input
        const isImageInput = event.target.closest('input[type="file"]');
        const isSpecificationInput = event.target.closest('.specification-row input');

        // Skip saving if it's an image or specification input
        if (isImageInput || isSpecificationInput) {
            return; // Don't save in these cases
        }

        // Only save details if the change isn't related to images or specifications
        if (selectedButton) {
            const type = selectedButton.classList.contains('family') ? 'family' : 'product';
            const id = selectedButton.dataset.id;
            saveDetails(type, id);
        }
    });

    // Helper function to generate child ID based on parent ID
    const generateChildId = (parentId) => {
        // Get the children of the parent from the DOM or cache
        const children = familyList.querySelectorAll(`[data-parent-id="${parentId}"]`);
        let maxChildNumber = 0;

        // Find the highest child number from the existing families/products
        children.forEach((child) => {
            const childId = child.dataset.id;
            const childIdParts = childId.split('.');  // Split ID into parts (e.g., "1.1", "1.1.1", "1.1.2")
            const childNumber = parseInt(childIdParts[childIdParts.length - 1], 10);
            if (childNumber > maxChildNumber) {
                maxChildNumber = childNumber;
            }
        });

        // The next child ID will be the current highest + 1
        const newChildId = `${parentId}.${maxChildNumber + 1}`;
        return newChildId;
    };

    const deleteProduct = (id) => {
        const Product = document.querySelector(`[data-id="${id}"]`);
        if (Product) {
            Product.remove(); // Remove the element from DOM

            // If you are using localStorage, also remove the family/product data
            delete familyCache[id];
            saveToLocalStorage();  // Ensure local storage reflects the deletion
        }
    };


    const createProductButton = (parentDetails, parentId) => {
        const newProductId = generateChildId(parentId);
        familyCount++;
        const productButton = createButton('New Product', 'product');
        productButton.dataset.id = newProductId;
        productButton.dataset.parentId = parentId;
        productButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleSelection(productButton);
            showDetails('product', newProductId);
        });

        detailsCache[newProductId] = {
            ...parentDetails,
            type: 'product', // Save type as product
            specifications: JSON.parse(JSON.stringify(parentDetails.specifications || [])),
        };

        imagePreviewsCache[newProductId] = [...(imagePreviewsCache[parentId] || [])];
        saveToLocalStorage();
        return productButton;
    };


    addProductButton.addEventListener('click', () => {
        if (!selectedButton || !selectedButton.classList.contains('family')) {
            console.error("Cannot create a product under a non-family item.");
            return;
        }

        const parentId = selectedButton.dataset.id;
        let childList = selectedButton.nextElementSibling;
        if (!childList || childList.tagName !== 'UL') {
            childList = document.createElement('ul');
            selectedButton.after(childList);
        }
        const parentDetails = detailsCache[parentId] || {};
        const childItem = document.createElement('li');
        childItem.appendChild(createProductButton(parentDetails, parentId));
        childList.appendChild(childItem);
        selectedButton.dataset.childType = 'product';
        event.preventDefault();
        saveToLocalStorage();
    });

    const initializeEventListeners = () => {
        familyList.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                handleSelection(button);
                const type = button.classList.contains('family') ? 'family' : 'product';
                showDetails(type, button.dataset.id);
            });
        });
    };

    loadFromLocalStorage();
    const firstFamilyButton = familyList.querySelector('button');
    if (firstFamilyButton) {
        handleSelection(firstFamilyButton);
        showDetails('family', firstFamilyButton.dataset.id);
    }

    document.getElementById('showCacheButton').addEventListener('click', () => {
        const cacheDisplay = document.getElementById('cacheDisplay');
        event.preventDefault();
        cacheDisplay.textContent = JSON.stringify(detailsCache, null, 2);  // Format the JSON for easy reading
    });
});
