document.addEventListener('DOMContentLoaded', function() {
    // Select all buttons with the class 'delete' or 'cart'
    const actionButtons = document.querySelectorAll('.delete, .cart, .empty-cart');

    actionButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const action = button.dataset.action;  // Get the action (e.g., 'delete', 'cart')
            const productId = button.dataset.productId;  // Get the product ID

            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;  // Get CSRF token

            // Create a new FormData object to send the data
            const formData = new FormData();
            formData.append('action', action + '_' + productId);  // Action and product ID
            formData.append('product_id', productId);  // Product ID
            formData.append('csrfmiddlewaretoken', csrfToken);  // CSRF token

            // Create a POST request using fetch
            fetch('/favorites/', {  // Change the URL to '/favorites/' to work with the favorites page
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    location.reload();  // Reload the page if the request is successful
                } else {
                    alert(data.message);  // Display an error message if something goes wrong
                }
            })
            .catch(error => {
                alert('Something went wrong. Please try again later.');
            });
        });
    });
});
