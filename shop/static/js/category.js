document.addEventListener('DOMContentLoaded', function() {
    const actionButtons = document.querySelectorAll('.favorite, .cart');

    actionButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const action = button.dataset.action;
            const productId = button.dataset.productId;

            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            const formData = new FormData();
            formData.append('action', action + '_' + productId);
            formData.append('product_id', productId);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    location.reload();
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                alert('Something went wrong. Please try again later.');
            });
        });
    });
});