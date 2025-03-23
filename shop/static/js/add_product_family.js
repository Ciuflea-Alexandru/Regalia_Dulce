document.addEventListener('DOMContentLoaded', () => {
    const addProductButton = document.querySelector('.add-product');
    const deleteButton = document.querySelector('.delete-button');
    const createProductFamilyButton = document.querySelector('.create-product-family');
    const familyList = document.querySelector('.family-list');
    const section2 = document.querySelector('.section2');
    let selectedButton = null;
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
            setupRootFamily();
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

    function handleSelection(button) {
        if (selectedButton) {
            selectedButton.classList.remove('selected'); // Remove 'selected' class from previously selected button
            const previousListItem = selectedButton.closest('li'); // Find the closest 'li' element
            if (previousListItem) {
                previousListItem.style.listStyleType = ''; // Reset the list style type for the previous item
            }
        }

        button.classList.add('selected'); // Add 'selected' class to the currently clicked button
        const listItem = button.closest('li'); // Find the closest 'li' element for the button
        if (listItem) {
            listItem.style.listStyleType = 'disc'; // Change the list style type of the selected item to 'disc'
        }

        selectedButton = button; // Update selectedButton to the currently clicked button
    }

function setupRootFamily() {
    const transaction = db.transaction(["ProductDetails"], "readwrite");
    const store = transaction.objectStore("ProductDetails");

    // Define the "Root Family" product
    const rootFamilyProduct = {
        id: 1,
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
        features: [],
        images: [],
        ship: "",
        specifications: []
    };

    // Attempt to get the product first
    const getRequest = store.get(1);
    getRequest.onsuccess = function (event) {
        if (!event.target.result) {
            // If not found, add the root family product
            const addRequest = store.put(rootFamilyProduct);
            addRequest.onsuccess = () => console.log("Root Family product created in IndexedDB.");
            addRequest.onerror = () => console.log("Error creating Root Family product.");
        }
    };

    // Create and add the "Root Family" button
    const rootFamilyButton = document.createElement('button');
    rootFamilyButton.classList.add('root-family-button');
    rootFamilyButton.textContent = 'Root Family';

    // Append the button to the family list
    const listItem = document.createElement('li');
    listItem.appendChild(rootFamilyButton);
    familyList.prepend(listItem); // Always keep it at the top

    // Select the button when it's added
    handleSelection(rootFamilyButton);

    // Add event listener to ensure the product object is stored
    rootFamilyButton.addEventListener('click', () => {
        const putRequest = store.put(rootFamilyProduct);
        putRequest.onsuccess = () => console.log("Root Family product updated in IndexedDB.");
        putRequest.onerror = () => console.log("Error updating Root Family product.");
    });
}

    function loadDetails() {
        const transaction = db.transaction(["ProductDetails"], "readonly");
        const store = transaction.objectStore("ProductDetails");
        const request = store.get(1); // Get the "Root Family" product (id: 1)

        request.onsuccess = function (event) {
            const rootFamilyProduct = event.target.result;

            if (rootFamilyProduct) {
                console.log("Loaded Root Family product:", rootFamilyProduct);
                handleSelection(document.querySelector('.root-family-button')); // Select Root Family button
            } else {
                console.log("No Root Family product found. Creating one...");
                createRootFamilyProduct(); // If missing, create it
            }
        };

        request.onerror = function () {
            console.error("Error loading Root Family product.");
        };
    }

    // Initialize the database
    initializeIndexDB();

    const showDetails = (type, id) => {
        section2.innerHTML = ''; // Clear the section2 content

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
            Choose Image
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
    </div>`;

        section2.appendChild(detailsDiv); // Append the created details div to section2
    };

});
