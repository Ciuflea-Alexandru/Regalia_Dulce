document.addEventListener('DOMContentLoaded', function () {
    function handleImageFunctionality() {
        const mainImage = document.querySelector('.main-image');
        const thumbnails = document.querySelectorAll('.product-image');
        const pageIndicators = document.querySelector('.page-indicators');
        const itemsPerPage = 3; // Three items per page
        let currentPage = 1;

        // Dynamically create page circles based on the number of pages
        const totalPages = Math.ceil(thumbnails.length / itemsPerPage);
        if (totalPages > 0) {
            pageIndicators.innerHTML = ''; // Clear existing indicators if any

            for (let i = 1; i <= totalPages; i++) {
                const circle = document.createElement('span');
                circle.classList.add('page-circle');
                circle.setAttribute('data-page', i);
                pageIndicators.appendChild(circle);
            }
        }

        // Get all the dynamically created circles
        const pageCircles = document.querySelectorAll('.page-circle');

        thumbnails.forEach((image, index) => {
            const button = image.previousElementSibling;
            if (button && button.classList.contains('image-button')) {
                button.addEventListener('click', () => fadeMainImage(image.src));
            }
        });

        function fadeMainImage(newSrc) {
            mainImage.classList.add('fade-out');
            setTimeout(() => {
                mainImage.src = newSrc;
                mainImage.classList.remove('fade-out');
                mainImage.classList.add('fade-in');
            }, 300);
        }

        function updatePageIndicators() {
            pageCircles.forEach(circle => circle.classList.remove('active'));
            const activeCircle = document.querySelector(`.page-circle[data-page="${currentPage}"]`);
            if (activeCircle) activeCircle.classList.add('active');
        }

        // Adjust the grid based on the current page
        function updateGridForPage(page) {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = page * itemsPerPage;
            let itemsToDisplay = [...thumbnails].slice(startIndex, endIndex);

            // If there are fewer than 3 items, duplicate the first items to fill the grid
            const itemsNeeded = itemsPerPage - itemsToDisplay.length;
            if (itemsNeeded > 0) {
                const extraItems = [...thumbnails].slice(0, itemsNeeded);
                itemsToDisplay = itemsToDisplay.concat(extraItems);
            }

            // Show the items in the grid and hide the others
            thumbnails.forEach((image, index) => {
                if (itemsToDisplay.includes(image)) {
                    image.closest('.image-item').style.display = 'block';
                    image.closest('.image-item').style.animation = 'fadeIn 2.0s ease-out forwards'; // Apply fade-in for the item
                } else {
                    image.closest('.image-item').style.display = 'none';
                }
            });
            updatePageIndicators();
        }

        pageCircles.forEach(circle => {
            circle.addEventListener('click', () => {
                currentPage = parseInt(circle.getAttribute('data-page'));
                updateGridForPage(currentPage);
            });
        });

        updateGridForPage(currentPage); // Initialize with the first page
    }
    handleImageFunctionality();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleQuantityButtons() {
        let add_quantity = 1;

        document.querySelectorAll('.increase, .decrease').forEach(function (button) {
            button.addEventListener('click', function () {
                const productId = button.dataset.productId;
                const quantityElement = document.querySelector(`#quantity_${productId}`);

                if (button.classList.contains('increase')) {
                    add_quantity++;
                } else if (button.classList.contains('decrease') && add_quantity > 1) {
                    add_quantity--;
                }

                quantityElement.textContent = add_quantity;
            });
        });

        window.getAddQuantity = () => add_quantity;
    }
    handleQuantityButtons();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleSubmission() {
        document.querySelectorAll('.cart, .favorite, .delete-review-button, .like, .dislike').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();

                const action = button.dataset.action;
                const productId = button.dataset.productId;
                const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;
                const quantity = window.getAddQuantity ? window.getAddQuantity() : 1;
                const reviewId = button.dataset.reviewId;

                const formData = new FormData();
                formData.append('action', action);
                formData.append('product_id', productId);
                formData.append('quantity', quantity);
                formData.append('review_id', reviewId);
                formData.append('csrfmiddlewaretoken', csrfToken);

                fetch(``, {
                    method: 'POST',
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                    if (data.status === 'success') {
                        location.reload();
                    } else {
                        alert(data.message);
                    }
                })
                    .catch(() => {
                    alert('Something went wrong. Please try again later.');
                });
            });
        });
    }
    handleSubmission();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleShowMoreSections() {
        const pairs = [
            { button: '.show-ingredients-button', content: '.ingredients', section: '.ingredients-nutritional-values' },
            { button: '.show-nutritional-values-button', content: '.nutritional-values', section: '.ingredients-nutritional-values' }
        ];

        pairs.forEach(({ button, content, section }) => {
            const btn = document.querySelector(button);
            const cnt = document.querySelector(content);
            const sec = document.querySelector(section);
            if (btn && cnt && sec) {
                btn.addEventListener('click', () => {
                    const isExpanded = cnt.style.height === 'auto';

                    if (isExpanded) {
                        // Collapse the specific content
                        cnt.style.height = '15vh';
                        cnt.style.overflow = 'hidden';
                        // Rotate the button back to down
                        btn.style.transform = 'translateX(-50%) rotate(90deg)';
                    } else {
                        // Expand the specific content
                        cnt.style.height = 'auto';
                        cnt.style.overflow = 'visible';
                        // Rotate the button to up
                        btn.style.transform = 'translateX(-50%) rotate(-90deg)';
                    }

                    // Check if either section is expanded, and adjust the main section visibility
                    const isIngredientsExpanded = document.querySelector('.ingredients').style.height === 'auto';
                    const isNutritionalValuesExpanded = document.querySelector('.nutritional-values').style.height === 'auto';

                    if (isIngredientsExpanded || isNutritionalValuesExpanded) {
                        // Ensure the main section remains expanded if any content is visible
                        sec.style.height = 'auto';
                        sec.style.overflow = 'visible';
                    } else {
                        // Collapse the main section if both content sections are hidden
                        sec.style.height = '15vh';
                        sec.style.overflow = 'hidden';
                    }
                });
            }
        });
    }
    handleShowMoreSections();
});


document.addEventListener('DOMContentLoaded', function () {
    function submitReview() {
        const stars = document.querySelectorAll('.review-score-1, .review-score-2, .review-score-3, .review-score-4, .review-score-5');
        const reviewTitleInput = document.querySelector('.review-title');
        const reviewTextArea = document.querySelector('.review-textarea');
        const submitButton = document.querySelector('.submit-review');
        const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;
        const errorMessage = document.createElement('p');
        const productId = submitButton.dataset.productId;  // You must set this in HTML

        errorMessage.classList.add('error-message');
        submitButton.parentNode.appendChild(errorMessage);

        let selectedScore = 0;

        function handleStarHover() {
            stars.forEach((star, index) => {
                star.addEventListener('mouseenter', () => highlightStars(index));
                star.addEventListener('mouseleave', () => {
                    if (selectedScore === 0) clearStars();
                    else highlightStars(selectedScore - 1);
                });
            });
        }

        function highlightStars(index) {
            stars.forEach((s, i) => s.textContent = i <= index ? '★' : '☆');
        }

        function clearStars() {
            stars.forEach(star => star.textContent = '☆');
        }

        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedScore = selectedScore === index + 1 ? 0 : index + 1;
                selectedScore === 0 ? clearStars() : highlightStars(index);
            });
        });

        submitButton.addEventListener('click', () => {
            errorMessage.textContent = '';

            if (selectedScore === 0) {
                errorMessage.textContent = 'Please select a score!';
            } else if (reviewTitleInput.value.trim() === '') {
                errorMessage.textContent = 'Please provide a review title!';
            } else if (reviewTextArea.value.trim() === '') {
                errorMessage.textContent = 'Please write a review!';
            } else {
                const formData = new FormData();
                formData.append('action', 'submit_review');
                formData.append('score', selectedScore);
                formData.append('title', reviewTitleInput.value.trim());
                formData.append('review', reviewTextArea.value.trim());
                formData.append('csrfmiddlewaretoken', csrfToken);

                fetch(``, {
                    method: 'POST',
                    body: formData,
                })
                    .then(response => response.json())
                    .then(data => {
                    if (data.status === 'success') {
                        reviewTitleInput.value = '';
                        reviewTextArea.value = '';
                        selectedScore = 0;
                        clearStars();
                        location.reload();
                    } else {
                        errorMessage.textContent = data.message || 'Something went wrong!';
                    }
                })
                    .catch(() => {
                    errorMessage.textContent = 'Network error. Please try again.';
                });
            }
        });

        handleStarHover();
    }
    submitReview();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleShowMoreReview() {
        const addReviewButton = document.querySelector('.add-review-button');
        const reviewContainer = document.querySelector('.product-review-container');
        const reviewGrid = document.querySelector('.review-grid')

        if (addReviewButton && reviewContainer) {
            addReviewButton.addEventListener('click', function () {
                if (reviewContainer.style.visibility === 'visible') {
                    reviewContainer.style.visibility = 'hidden';
                    reviewGrid.style.position = 'relative';
                    reviewGrid.style.width = '100%';
                    reviewGrid.style.height = '90%';
                    addReviewButton.textContent = 'Add a review';
                } else {
                    reviewContainer.style.visibility = 'visible';
                    reviewGrid.style.position = 'absolute';
                    reviewGrid.style.width = '1px';
                    reviewGrid.style.height = '1px';
                    addReviewButton.textContent = 'Cancel review';
                }
            });
        }
    }
    handleShowMoreReview();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleGraphBars() {
        const bars = document.querySelectorAll('.graph-bar-foreground');

        bars.forEach(function (bar) {
            const percentage = bar.getAttribute('data-percentage');
            if (percentage) {
                bar.style.width = percentage + '%';
            }
        });
    }
    handleGraphBars();
});

document.addEventListener('DOMContentLoaded', function () {
    function handleReviewPagination() {
        function handlePaginationClick(button) {
            const page = button.getAttribute('data-page');
            if (!page) return;

            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            const formData = new FormData();
            formData.append('csrfmiddlewaretoken', csrfToken);
            formData.append('page', page);

            fetch('', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(response => response.text())
                .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const reviewsSection = doc.querySelector('.review-grid').parentNode;
                const paginationSection = doc.querySelector('.review-pages');

                const parentReviews = document.querySelector('.review-grid').parentNode;
                parentReviews.replaceWith(reviewsSection);
                const parentPagination = document.querySelector('.review-pages');
                parentPagination.replaceWith(paginationSection);

                bindPaginationButtons();
                rebindLikeDislikeButtons();
            })
                .catch(() => {
                alert('Failed to load reviews.');
            });
        }

        function paginationClickHandler(event) {
            handlePaginationClick(event.target);
        }

        function bindPaginationButtons() {
            document.querySelectorAll('.review-pages button').forEach(function (button) {
                button.removeEventListener('click', paginationClickHandler);
                button.addEventListener('click', paginationClickHandler);
            });
        }

        function rebindLikeDislikeButtons() {
            document.querySelectorAll('.like, .dislike').forEach(function (button) {
                button.removeEventListener('click', handleLikeDislike);
                button.addEventListener('click', handleLikeDislike);
            });
        }

        function handleLikeDislike(event) {
            event.preventDefault();

            const action = event.target.classList.contains('like') ? 'like' : 'dislike';
            const reviewId = event.target.dataset.reviewId;
            const csrfToken = document.querySelector('[name="csrfmiddlewaretoken"]').value;

            const formData = new FormData();
            formData.append('action', action);
            formData.append('review_id', reviewId);
            formData.append('csrfmiddlewaretoken', csrfToken);

            fetch('', {
                method: 'POST',
                body: formData,
            })
                .then(response => response.json())
                .then(data => {
                if (data.status === 'success') {
                    location.reload();
                } else {
                    alert(data.message);
                }
            })
                .catch(() => {
                alert('Something went wrong.');
            });
        }

        bindPaginationButtons();
    }

    handleReviewPagination();
});
