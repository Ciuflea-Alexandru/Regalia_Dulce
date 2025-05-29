document.addEventListener('DOMContentLoaded', function() {
    const actionButtons = document.querySelectorAll('.decrease, .increase, .delete, .favorite');
    const couponButton = document.querySelector('.coupon');
    const couponInput = document.getElementById('coupon-code');

    actionButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const action = button.dataset.action;
            const productId = button.dataset.productId;

            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            const formData = new FormData();
            formData.append('action', action + '_' + productId);
            formData.append('product_id', productId);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('/cart/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    location.reload();
                } else {
                    location.reload();
                }
            })
            .catch(error => {
                alert('Something went wrong. Please try again later.');
            });
        });
    });

    if (couponButton && couponInput) {
        couponButton.addEventListener('click', function() {
            const couponCode = couponInput.value.trim();
            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            const formData = new FormData();
            formData.append('coupon_code', couponCode);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('/cart/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    location.reload();
                } else {
                    location.reload();
                }
            })
            .catch(error => {
                alert('Something went wrong. Please try again later.');
            });
        });
    }
});
