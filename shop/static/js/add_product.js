document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const productNameInput = document.querySelector('input[name="name"]');
    const categoryInput = document.querySelector('select[name="category_subcategory"]');
    const priceInput = document.querySelector('input[name="price"]');
    const stockInput = document.querySelector('input[name="stock"]');
    const shippersInput = document.querySelector('input[name="ship"]');
    const imageInput = document.querySelector('input[name="images"]');
    const imagePreviewContainer = document.querySelector('.image-preview');
    const descriptionInput = document.querySelector('.description-editor');
    const ingredientsInput = document.querySelector('.ingredients-editor');
    const nutritionalValueDiv = document.querySelector('.nutritional-value');
    const createNutritionalValueRowButton = document.querySelector('.add-nutritional-values');

    let db;

    function initializeIndexDB() {
        const request = indexedDB.open("Product", 1);
        request.onupgradeneeded = function (event) {
            db = event.target.result;
            db.createObjectStore("ProductDetails", { keyPath: "id", autoIncrement: false });
        };
        request.onsuccess = function (event) {
            db = event.target.result;
            checkNavigationType();
        };
    }

    function checkNavigationType() {
        const navType = performance.navigation.type;
        if (navType === performance.navigation.TYPE_NAVIGATE) {
            resetDetails();
        } else if (navType === performance.navigation.TYPE_RELOAD || navType === performance.navigation.TYPE_BACK_FORWARD) {
            loadDetails();
        }
    }

    function resetDetails() {
        productNameInput.value = '';
        categoryInput.value = '';
        priceInput.value = '';
        stockInput.value = '';
        shippersInput.value = '';
        imagePreviewContainer.innerHTML = '';
        nutritionalValueDiv.innerHTML = '';
        quill.setContents([]);
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        store.clear();
    }

    function saveDetails(field) {
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            let productData = event.target.result || {
                id: 1,
                name: '',
                category: '',
                price: '',
                stock: '',
                ship: '',
                images: [],
                nutritionalValues: [],
                description: ''
            };
            if (field === 'name') productData.name = productNameInput.value;
            else if (field === 'category') productData.category = categoryInput.value;
            else if (field === 'price') productData.price = priceInput.value;
            else if (field === 'stock') productData.stock = stockInput.value;
            else if (field === 'ship') productData.ship = shippersInput.value;
            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    }

    productNameInput.addEventListener('input', () => saveDetails('name'));
    categoryInput.addEventListener('input', () => saveDetails('category'));
    priceInput.addEventListener('input', () => saveDetails('price'));
    stockInput.addEventListener('input', () => saveDetails('stock'));
    shippersInput.addEventListener('input', () => saveDetails('ship'));
    imageInput.addEventListener('change', saveImages);

    function loadDetails() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);

        request.onsuccess = function (event) {
            const productData = event.target.result;
            if (productData) {
                productNameInput.value = productData.name || '';
                categoryInput.value = productData.category || '';
                priceInput.value = productData.price || '';
                stockInput.value = productData.stock || '';
                shippersInput.value = productData.ship || '';
                if (productData.description) {
                    const description = JSON.parse(productData.description); // Parse the saved JSON data
                    descriptionEditor.setContents(description); // Set Quill content from JSON
                }
                if (productData.ingredients) {
                    const ingredients = JSON.parse(productData.ingredients); // Parse the saved JSON data
                    ingredientsEditor.setContents(ingredients); // Set Quill content from JSON
                }
                if (productData.nutritionalValues) {
                    productData.nutritionalValues.forEach(nutritionalValue => {
                        addNutritionalValueRow(nutritionalValue.key, nutritionalValue.value);
                    });
                }
                loadImages();
            }
        };
    }

    function saveImages() {
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, images: [] };
            const images = Array.from(imageInput.files);
            const spaceLeft = 10 - productData.images.length;
            if (spaceLeft <= 0) {
                messageContainer.innerHTML = "<p>You cannot upload more than 10 images.</p>";
                messageContainer.style.color = "red";
                return;
            }
            const imagesToAdd = images.slice(0, spaceLeft);
            let loadedImages = 0;
            imagesToAdd.forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const newImageBlob = new Blob([e.target.result], { type: file.type });
                    // Check if the image already exists (duplicate check)
                    const isDuplicate = productData.images.some(existingImage =>
                    existingImage.size === newImageBlob.size &&
                    existingImage.type === newImageBlob.type &&
                    existingImage.name === file.name
                    );
                    if (!isDuplicate) {
                        productData.images.push(newImageBlob);
                        loadedImages++;
                    }
                    if (loadedImages === imagesToAdd.length) {
                        const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
                        const updateStore = updateTransaction.objectStore("ProductDetails");
                        updateStore.put(productData);
                        loadImages();
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        };
    }

    function loadImages() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            const productData = event.target.result;
            if (productData && productData.images) {
                imagePreviewContainer.innerHTML = '';
                productData.images.forEach((imageBlob, index) => {
                    const imgDiv = document.createElement('div');
                    imgDiv.classList.add('preview-image-container');
                    const img = document.createElement('img');
                    img.src = URL.createObjectURL(imageBlob);  // Load image as Blob URL
                    img.alt = 'Image preview';
                    img.classList.add('preview-image');
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'X';
                    deleteButton.classList.add('delete-preview');
                    deleteButton.addEventListener('click', (event) => {
                        event.preventDefault();
                        productData.images.splice(index, 1);
                        const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
                        const updateStore = updateTransaction.objectStore("ProductDetails");
                        updateStore.put(productData);
                        loadImages();
                    });
                    const moveLeftButton = document.createElement('button');
                    moveLeftButton.textContent = '<';
                    moveLeftButton.classList.add('move-left');
                    moveLeftButton.disabled = index === 0;
                    moveLeftButton.addEventListener('click', () => moveImage(index, 'left', productData));
                    const moveRightButton = document.createElement('button');
                    moveRightButton.textContent = '>';
                    moveRightButton.classList.add('move-right');
                    moveRightButton.disabled = index === productData.images.length - 1;
                    moveRightButton.addEventListener('click', () => moveImage(index, 'right', productData));
                    imgDiv.appendChild(img);
                    imgDiv.appendChild(deleteButton);
                    imgDiv.appendChild(moveLeftButton);
                    imgDiv.appendChild(moveRightButton);
                    imagePreviewContainer.appendChild(imgDiv);
                });
            }
        };
    }

    function moveImage(index, direction, productData) {
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < productData.images.length) {
            const movedImage = productData.images.splice(index, 1)[0];
            productData.images.splice(newIndex, 0, movedImage);
            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
            event.preventDefault();
            loadImages();
        }
    }

    var descriptionEditor = new Quill('.description-editor', {
        theme: 'snow',
        placeholder: 'Enter your product description here...',
        modules: {
            toolbar: [
                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline'],
                [{ 'align': [] }],
                ['link'],
                ['image']
            ]
        }
    });

    descriptionEditor.on('text-change', function () {
        const descriptionData = JSON.stringify(descriptionEditor.getContents());

        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);

        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, description: '', ingredients: '' };
            productData.description = descriptionData;

            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    });

    var ingredientsEditor = new Quill('.ingredients-editor', {
        theme: 'snow',
        placeholder: 'Enter your product ingredients here...',
        modules: {
            toolbar: [
                [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['bold', 'italic', 'underline'],
                [{ 'align': [] }],
                ['link'],
                ['image']
            ]
        }
    });

    ingredientsEditor.on('text-change', function () {
        const ingredientsData = JSON.stringify(ingredientsEditor.getContents());

        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);

        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, description: '', ingredients: '' };
            productData.ingredients = ingredientsData;

            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    });

    function addNutritionalValueRow(key = '', value = '') {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('nutritional-value-row');
        const column1Input = document.createElement('input');
        column1Input.type = 'text';
        column1Input.name = 'nutritional_value_column1[]';
        column1Input.placeholder = 'Nutritional Value Key';
        column1Input.classList.add('column');
        column1Input.value = key;
        const column2Input = document.createElement('input');
        column2Input.type = 'text';
        column2Input.name = 'nutritional_value_column2[]';
        column2Input.placeholder = 'Nutritional Value';
        column2Input.classList.add('column');
        column2Input.value = value;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-nutritional-values');
        deleteButton.addEventListener('click', () => {
            rowDiv.remove();
            saveNutritionalValues();  // Save after deletion
        });
        rowDiv.appendChild(column1Input);
        rowDiv.appendChild(column2Input);
        rowDiv.appendChild(deleteButton);
        nutritionalValueDiv.appendChild(rowDiv);
    }

    createNutritionalValueRowButton.addEventListener('click', () => addNutritionalValueRow());
    nutritionalValueDiv.addEventListener('input', saveNutritionalValues);

    function saveNutritionalValues() {
        const nutritionalValueRows = nutritionalValueDiv.querySelectorAll('.nutritional-value-row');
        const nutritionalValues = [];
        nutritionalValueRows.forEach(row => {
            const key = row.querySelector('input[name="nutritional_value_column1[]"]').value;
            const value = row.querySelector('input[name="nutritional_value_column2[]"]').value;
            if (key && value) {
                nutritionalValues.push({ key, value });
            }
        });
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, nutritionalValues: [] };
            productData.nutritionalValues = nutritionalValues;
            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    }

    function loadNutritionalValues() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            const productData = event.target.result;
            if (productData && productData.nutritionalValues) {
                productData.nutritionalValues.forEach(nutritionalValue => {
                    addNutritionalValueRow(nutritionalValue.key, nutritionalValue.value);
                });
            }
        };
    }

    function handleSubmitButton() {
        const submitButton = document.querySelector(".create-product");
        const messageContainer = document.createElement("div");
        messageContainer.className = "Message";
        form.appendChild(messageContainer);

        submitButton.addEventListener("click", function (event) {
            event.preventDefault();
            let errors = [];
            const transaction = db.transaction(["ProductDetails"], "readonly");
            const store = transaction.objectStore("ProductDetails");
            const request = store.get(1);
            const formData = new FormData();
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            const messagesContainer = document.querySelector('.Message');

            request.onsuccess = function (event) {
                const productData = event.target.result;
                const category = productData ? productData.category : "";
                const name = productData ? productData.name : "";
                const price = productData ? productData.price : "";
                const stock = productData ? productData.stock : "";
                const description = productData ? productData.description : "";
                const ingredients = productData && productData.ingredients ? productData.ingredients.length : 0;
                const nutritionalValues = productData && productData.nutritionalValues ? productData.nutritionalValues.length : 0;
                const images = productData && productData.images ? productData.images.length : 0;

                if (!category) errors.push("Product category is required.");
                if (!name) errors.push("Product name is required.");
                if (!price) errors.push("Product price is required.");
                if (!stock) errors.push("Product stock is required.");
                if (images < 3) {
                    errors.push("You must upload at least 3 images.");
                }
                if (!description || description === "<p><br></p>") errors.push("Product description is required.");
                if (ingredients === 0) errors.push("At least one ingredient is required.");
                if (nutritionalValues === 0) errors.push("At least one nutritional value is required.");

                if (errors.length > 0) {
                    messageContainer.innerHTML = errors.map(err => `<p>${err}</p>`).join("");
                    messageContainer.style.color = "red";
                } else {
                    formData.append('name', productData.name || '');
                    formData.append('category', productData.category || '');
                    formData.append('price', productData.price || '');
                    formData.append('stock', productData.stock || '');
                    formData.append('ship', productData.ship || '');

                    const descriptionHtml = descriptionEditor.root.innerHTML;
                    formData.append('description', descriptionHtml || '');

                    const ingredientsHtml = ingredientsEditor.root.innerHTML;
                    formData.append('ingredients', ingredientsHtml || '');

                    if (productData.nutritionalValues) {
                        productData.nutritionalValues.forEach((nutritionalValue, index) => {
                            formData.append(`nutritional_value_column1[${index}]`, nutritionalValue.key);
                            formData.append(`nutritional_value_column2[${index}]`, nutritionalValue.value);
                        });
                    }

                    if (productData.images) {
                        productData.images.forEach((imageBlob, index) => {
                            formData.append(`images[${index}]`, imageBlob, `image${index}.jpg`);
                        });
                    }

                    fetch('/add_product/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': csrfToken,
                        },
                    })
                        .then(response => response.json())
                        .then(data => {
                        messagesContainer.innerHTML = '';
                        const messageDiv = document.createElement('div');
                        messageDiv.classList.add('Message');
                        messageDiv.innerHTML = `<p>${data.message}</p>`;
                        messagesContainer.appendChild(messageDiv);
                    });
                }
            };
        });
    }
    handleSubmitButton();

    initializeIndexDB();
});