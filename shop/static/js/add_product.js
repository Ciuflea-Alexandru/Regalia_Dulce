document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const productNameInput = document.querySelector('input[name="name"]');
    const categoryInput = document.querySelector('select[name="category_subcategory"]');
    const priceInput = document.querySelector('input[name="price"]');
    const stockInput = document.querySelector('input[name="stock"]');
    const shippersInput = document.querySelector('input[name="ship"]');
    const imageInput = document.querySelector('input[name="images"]');
    const imagePreviewContainer = document.querySelector('.image-preview');
    const descriptionInput = document.querySelector('.quill-editor');
    const specificationDiv = document.querySelector('.specification');
    const featureDiv = document.querySelector('.feature');
    const createSpecificationRowButton = document.querySelector('.add-specifications');
    const createFutureRowButton = document.querySelector('.add-features');

    let db;

    function initializeIndexDB() {
        const request = indexedDB.open("Product", 1);
        request.onupgradeneeded = function (event) {
            db = event.target.result;
            const store = db.createObjectStore("ProductDetails", { keyPath: "id", autoIncrement: false });
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
        specificationDiv.innerHTML = '';
        featureDiv.innerHTML = '';
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
                specifications: [],
                features: [],
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
                if (productData.specifications) {
                    productData.specifications.forEach(spec => {
                        addSpecificationRow(spec.key, spec.value);
                    });
                }
                if (productData.features) {
                    productData.features.forEach(feature => {
                        addFutureRow(feature.key, feature.value);
                    });
                }
                if (productData.description) {
                    const description = JSON.parse(productData.description);
                    quill.setContents(description);
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

    // Save description to IndexedDB when it's updated
    var quill = new Quill('.quill-editor', {
        theme: 'snow',
        placeholder: 'Product description...',
        modules: {
            toolbar: [
                [{ header: '1' }, { header: '2' }, { font: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ indent: '-1' }, { indent: '+1' }],
                ['bold', 'italic', 'underline'],
                [{ align: [] }],
                ['link'],
                [{ 'color': [] }, { 'background': [] }],
                ['image', 'video'],
                ['clean']
            ]
        }
    });
    // Save description when it's changed
    quill.on('text-change', function () {
        const descriptionData = JSON.stringify(quill.getContents());

        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);

        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, description: '' };
            productData.description = descriptionData;

            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    });

    function addSpecificationRow(key = '', value = '') {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('specification-row');
        const column1Input = document.createElement('input');
        column1Input.type = 'text';
        column1Input.name = 'specification_column1[]';
        column1Input.placeholder = 'Specification Key';
        column1Input.classList.add('column');
        column1Input.value = key;
        const column2Input = document.createElement('input');
        column2Input.type = 'text';
        column2Input.name = 'specification_column2[]';
        column2Input.placeholder = 'Specification Value';
        column2Input.classList.add('column');
        column2Input.value = value;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-specifications');
        deleteButton.addEventListener('click', () => {
            rowDiv.remove();
            saveSpecifications();  // Save after deletion
        });
        rowDiv.appendChild(column1Input);
        rowDiv.appendChild(column2Input);
        rowDiv.appendChild(deleteButton);
        specificationDiv.appendChild(rowDiv);
    }
    createSpecificationRowButton.addEventListener('click', () => addSpecificationRow());
    specificationDiv.addEventListener('input', saveSpecifications);

    function saveSpecifications() {
        const specificationRows = specificationDiv.querySelectorAll('.specification-row');
        const specifications = [];
        specificationRows.forEach(row => {
            const key = row.querySelector('input[name="specification_column1[]"]').value;
            const value = row.querySelector('input[name="specification_column2[]"]').value;
            if (key && value) {
                specifications.push({ key, value });
            }
        });
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, specifications: [] };
            productData.specifications = specifications;
            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    }

    function loadSpecifications() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            const productData = event.target.result;
            if (productData && productData.specifications) {
                productData.specifications.forEach(spec => {
                    addSpecificationRow(spec.key, spec.value);
                });
            }
        };
    }

    function addFutureRow(key = '', value = '') {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('feature-row');
        const column1Input = document.createElement('input');
        column1Input.type = 'text';
        column1Input.name = 'feature_column1[]';
        column1Input.placeholder = 'Future Key';
        column1Input.classList.add('column');
        column1Input.value = key;
        const column2Input = document.createElement('input');
        column2Input.type = 'text';
        column2Input.name = 'feature_column2[]';
        column2Input.placeholder = 'Future Value';
        column2Input.classList.add('column');
        column2Input.value = value;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.classList.add('delete-feature');
        deleteButton.addEventListener('click', () => {
            rowDiv.remove();
            saveFutures();
        });
        rowDiv.appendChild(column1Input);
        rowDiv.appendChild(column2Input);
        rowDiv.appendChild(deleteButton);
        featureDiv.appendChild(rowDiv);
    }
    createFutureRowButton.addEventListener('click', () => addFutureRow());
    featureDiv.addEventListener('input', saveFutures);

    function saveFutures() {
        const featureRows = featureDiv.querySelectorAll('.feature-row');
        const features = [];
        featureRows.forEach(row => {
            const key = row.querySelector('input[name="feature_column1[]"]').value;
            const value = row.querySelector('input[name="feature_column2[]"]').value;
            if (key && value) {
                features.push({ key, value });
            }
        });
        const transaction = db.transaction(["ProductDetails"], "readwrite");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);
        request.onsuccess = function (event) {
            let productData = event.target.result || { id: 1, features: [] };
            productData.features = features;

            const updateTransaction = db.transaction(["ProductDetails"], "readwrite");
            const updateStore = updateTransaction.objectStore("ProductDetails");
            updateStore.put(productData);
        };
    }

    function loadFutures() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1);

        request.onsuccess = function (event) {
            const productData = event.target.result;
            if (productData && productData.features) {
                productData.features.forEach(feature => {
                    addFutureRow(feature.key, feature.value);
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

            request.onsuccess = function (event) {
                const productData = event.target.result;
                const category = productData ? productData.category : "";
                const name = productData ? productData.name : "";
                const price = productData ? productData.price : "";
                const stock = productData ? productData.stock : "";
                const description = productData ? productData.description : "";
                const specifications = productData && productData.specifications ? productData.specifications.length : 0;
                const features = productData && productData.features ? productData.features.length : 0;
                const images = productData && productData.images ? productData.images.length : 0;

                if (!category) errors.push("Product category is required.");
                if (!name) errors.push("Product name is required.");
                if (!price) errors.push("Product price is required.");
                if (!stock) errors.push("Product stock is required.");
                if (images < 5) {
                    errors.push("You must upload at least 5 images.");
                }
                if (!description || description === "<p><br></p>") errors.push("Product description is required.");
                if (specifications === 0) errors.push("At least one specification is required.");
                if (features === 0) errors.push("At least one feature is required.");

                if (errors.length > 0) {
                    messageContainer.innerHTML = errors.map(err => `<p>${err}</p>`).join("");
                    messageContainer.style.color = "red";
                } else {
                    // Proceed to submit the form data
                    const formData = new FormData();
                    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                    formData.append('name', productData.name || '');
                    formData.append('category_subcategory', productData.category || '');
                    formData.append('price', productData.price || '');
                    formData.append('stock', productData.stock || '');
                    formData.append('ship', productData.ship || '');
                    const descriptionHtml = quill.root.innerHTML;  // Quill instance's HTML content
                    formData.append('description', descriptionHtml || '');

                    if (productData.specifications) {
                        productData.specifications.forEach((spec, index) => {
                            formData.append(`specification_column1[${index}]`, spec.key);
                            formData.append(`specification_column2[${index}]`, spec.value);
                        });
                    }
                    if (productData.features) {
                        productData.features.forEach((feature, index) => {
                            formData.append(`feature_column1[${index}]`, feature.key);
                            formData.append(`feature_column2[${index}]`, feature.value);
                        });
                    }
                    if (productData.images) {
                        productData.images.forEach((imageBlob, index) => {
                            formData.append(`images[${index}]`, imageBlob, `image${index}.jpg`);
                        });
                    }

                    // Submit the data to the server
                    fetch('/add_product/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': csrfToken,
                        },
                    })
                        .then(response => response.json())
                        .then(data => {
                        if (data.success) {
                            alert('Product added successfully!');
                        } else {
                            alert('Failed to add product.');
                        }
                    })
                        .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while adding the product.');
                    });
                }
            };
        });
    }
    handleSubmitButton();

    initializeIndexDB();
});