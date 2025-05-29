document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.search-button').forEach(button => {
        button.addEventListener('click', () => {
            const { action, productId } = button.dataset;
            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            if (action === 'search') {
                const searchQuery = document.querySelector('.search-bar').value;

                const formData = new FormData();
                formData.append('action', `${action}_${productId}`);
                formData.append('product_id', productId);
                formData.append('search_query', searchQuery);
                formData.append('csrfmiddlewaretoken', csrfToken);

                fetch('/search/', { method: 'POST', body: formData })
                    .then(res => res.json())
                    .then(data => {
                        if (data.status === 'success') {
                            const resultsContainer = document.getElementById('results-container');
                            if (resultsContainer) {
                                resultsContainer.innerHTML = data.products.map(product => `
                                    <div class="product-container">
                                        <div class="product-image-container">
                                            <a class="product-image-link" href="/product/${product.id}">
                                                <img class="product-image" src="${product.image_url || ''}">
                                            </a>
                                        </div>
                                        <div class="product-details-container">
                                            <a class="product-link" href="/product/${product.id}">
                                                <h1 class="product-title">${product.name}</h1>
                                            </a>
                                            <h2 class="product-description">${product.description}</h2>
                                        </div>
                                    </div>
                                `).join('');
                            }
                        } else {
                            alert(data.message);
                        }
                    })
                    .catch(() => alert('Something went wrong. Please try again later.'));
            }
        });
    });
});
