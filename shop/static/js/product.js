document.addEventListener('DOMContentLoaded', () => {
    const productGrids = document.querySelectorAll('.main-images-grid');
    const nextArrows = document.querySelectorAll('.next-arrow');
    const prevArrows = document.querySelectorAll('.prev-arrow');
    const scrollDirection = 'vertical';


    const productVariations = document.querySelectorAll('.product-variation-link');

    productVariations.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();  // Prevent the default link behavior

            const selectedProduct = document.querySelector('.selected-product');
            const clickedProductId = this.getAttribute('data-product-id');
            const clickedProduct = document.querySelector(`.product-variation[data-product-id="${clickedProductId}"]`);

            // Swap the selected class
            selectedProduct.classList.remove('selected-product');
            clickedProduct.classList.add('selected-product');

            // Reorder the products visually
            const grid = document.querySelector('.main-variation-grid');
            grid.insertBefore(clickedProduct, selectedProduct);

            // Optionally, you can update the URL with the selected product ID
            const newUrl = window.location.pathname + `?product_id=${clickedProductId}`;
            history.pushState(null, null, newUrl);  // Change the URL without reloading
        });
    });

    const mainImage = document.querySelector('.main-image'); // The main product image

    productGrids.forEach((productGrid, index) => {
        let cardSize, totalCards, cardsPerStack, currentStack;

        if (scrollDirection === 'vertical') {
            cardSize = productGrid.querySelector('.main-product-images').offsetHeight;
            totalCards = productGrid.querySelectorAll('.main-product-images').length;
            cardsPerStack = 6;
            currentStack = 0;
        } else if (scrollDirection === 'horizontal') {
            cardSize = productGrid.querySelector('.main-product-images').offsetWidth;
            totalCards = productGrid.querySelectorAll('.main-product-images').length;
            cardsPerStack = 4;
            currentStack = 0;
        }

        const updateArrowVisibility = () => {
            const scrollPosition = scrollDirection === 'vertical' ? productGrid.scrollTop : productGrid.scrollLeft;
            const maxScrollablePosition = (totalCards - cardsPerStack) * cardSize;

            prevArrows[index].classList.toggle('hidden', scrollPosition === 0);
            nextArrows[index].classList.toggle('hidden', scrollPosition >= maxScrollablePosition + 1);
        };

        updateArrowVisibility();

        nextArrows[index].addEventListener('click', () => {
            if (currentStack < Math.floor(totalCards / cardsPerStack)) {
                currentStack++;
                if (scrollDirection === 'vertical') {
                    productGrid.scrollTop += cardSize * cardsPerStack;
                } else {
                    productGrid.scrollLeft += cardSize * cardsPerStack;
                }
            }
            updateArrowVisibility();
        });

        prevArrows[index].addEventListener('click', () => {
            if (currentStack > 0) {
                currentStack--;
                if (scrollDirection === 'vertical') {
                    productGrid.scrollTop -= cardSize * cardsPerStack;
                } else {
                    productGrid.scrollLeft -= cardSize * cardsPerStack;
                }
            }
            updateArrowVisibility();
        });

        productGrid.addEventListener('scroll', updateArrowVisibility);

        // Handle image selection for main image display
        const imageButtons = productGrid.querySelectorAll('.main-product-images-button');
        imageButtons.forEach((button, imgIndex) => {
            button.addEventListener('click', () => {
                const selectedImage = productGrid.querySelectorAll('.main-product-images')[imgIndex];
                mainImage.src = selectedImage.src; // Set the main image's source to the clicked image's source
            });
        });
    });
});

function updateStarRating(rating) {
    const stars = document.querySelectorAll('.product-rating .star');

    // Fill whole stars
    for (let i = 0; i < Math.floor(rating); i++) {
        stars[i].classList.add('filled');
    }

    // Handle half-star
    if (rating - Math.floor(rating) > 0) {
        stars[Math.floor(rating)].classList.add('half');
    }
}

let previousScrollPosition = window.scrollY;

window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navigation-bar');
    const navbarTop = navbar.offsetTop;
    const currentScrollPosition = window.scrollY;

    if (currentScrollPosition > previousScrollPosition) {
        if (currentScrollPosition >= navbarTop) {
            navbar.classList.add('fixed-top');
        }
    } else {
        if (currentScrollPosition <= 600 && navbar.classList.contains('fixed-top')) {
            navbar.classList.remove('fixed-top');
        }
    }

    previousScrollPosition = currentScrollPosition;

    const topButton = document.querySelector('.top-button');
    topButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const discoveryButton = document.querySelector('.information-button');
    discoveryButton.addEventListener('click', () => {
        const productDiscoverySection = document.querySelector('.product-information');
        const productDiscoveryOffsetTop = productDiscoverySection.offsetTop;
        window.scrollTo({
            top: productDiscoveryOffsetTop,
            behavior: 'smooth'
        });
    });

    const specificationButton = document.querySelector('.specification-button');
    specificationButton.addEventListener('click', () => {
        const specificationSection = document.querySelector('.specification');
        const specificationSectionOffsetTop = specificationSection.offsetTop;
        window.scrollTo({
            top: specificationSectionOffsetTop,
            behavior: 'smooth'
        });
    });

    const reviewButton = document.querySelector('.review-button');
    reviewButton.addEventListener('click', () => {
        const reviewSection = document.querySelector('.reviews');
        const reviewSectionOffsetTop = reviewSection.offsetTop;
        window.scrollTo({
            top: reviewSectionOffsetTop,
            behavior: 'smooth'
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const informationTextButton = document.querySelector('.show-information-button');
    const informationTextSection = document.querySelector('.information-text');
    informationTextButton.addEventListener('click', () => {

        informationTextButton.style.display = 'none';
        informationTextSection.style.overflow = 'visible';
        informationTextSection.style.height = 'auto';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const specificationButton = document.querySelector('.show-specification-button');
    const specificationGrid = document.querySelector('.specification-grid');
    specificationButton.addEventListener('click', () => {

        specificationButton.style.display = 'none';
        specificationGrid.style.overflow = 'visible';
        specificationGrid.style.height = 'auto';
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const reviewsSection = document.querySelector('.reviews');
    const reviewsContainer = document.querySelector('.review-grid');
    const reviewContainers = document.querySelectorAll('.review-container');

    const pageButtonsContainer = document.querySelector('.review-pages');
    const previousPageButton = pageButtonsContainer.querySelector('.previous-page');
    const nextPageButton = pageButtonsContainer.querySelector('.next-page');

    let currentPage = 0;
    const reviewsPerPage = 10;
    const numPages = Math.ceil(reviewContainers.length / reviewsPerPage);

    function showReviewPage(pageNumber) {
        currentPage = pageNumber;

        const startIndex = pageNumber * reviewsPerPage;
        const endIndex = Math.min(startIndex + reviewsPerPage, reviewContainers.length);

        if (reviewContainers.length === 0) {
            reviewsContainer.textContent = 'Be the first to leave a review!';
            reviewsContainer.style.textAlign = 'center';
            reviewsContainer.style.fontSize = '30px';
            reviewsContainer.style.display = 'block';

            pageButtonsContainer.style.display = 'none';
            return;
        }

        reviewsContainer.style.height = 'auto';
        reviewsContainer.style.overflow = 'hidden';
        reviewsContainer.classList.add('review-grid');

        for (let i = 0; i < reviewContainers.length; i++) {
            reviewContainers[i].style.display = i >= startIndex && i < endIndex ? 'grid' : 'none';
        }

        // Update pagination buttons
        previousPageButton.disabled = pageNumber === 0;
        nextPageButton.disabled = pageNumber === numPages - 1;

        const pageButtons = document.querySelectorAll('.review-page');
        pageButtons.forEach((button, index) => {
            // Adjust the conditions to display page numbers and ellipsis
            if (index === 0 || index === numPages - 1 ||
            (index >= pageNumber - 1 && index <= pageNumber + 1)) {
                button.style.display = 'inline-block';
                button.textContent = index + 1;
            } else {
                button.style.display = 'none';
            }
            // Remove any existing ellipsis before and after the current button
            const previousEllipsis = button.previousElementSibling;
            if (previousEllipsis && previousEllipsis.textContent === '...') {
                previousEllipsis.remove();
            }

            // Add ellipsis if necessary
            if (index === pageNumber - 2 && index !== 0) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pageButtonsContainer.insertBefore(ellipsis, button);
            } else if (index === pageNumber + 2 && index !== numPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                pageButtonsContainer.insertBefore(ellipsis, button);
            }
            button.style.backgroundColor = index === pageNumber ? '#050505' : '#CE563C';
            button.style.color = index === pageNumber ? '#CE563C' : '#050505';
        });

        // Update button order and styling
        pageButtonsContainer.insertBefore(previousPageButton, pageButtons[0]);
        pageButtonsContainer.appendChild(nextPageButton);

        // Ensure correct button styling after DOM manipulation
        previousPageButton.style.backgroundColor = pageNumber === 0 ? '#050505' : '#CE563C';
        previousPageButton.style.color = pageNumber === 0 ? '#CE563C' : '#050505';
        previousPageButton.style.border = '1px solid #CE563C';

        nextPageButton.style.backgroundColor = pageNumber === numPages - 1 ? '#050505' : '#CE563C';
        nextPageButton.style.color = pageNumber === numPages - 1 ? '#CE563C' : '#050505';

    }

    // Create review page buttons between first and last buttons (excluding them)
    for (let i = 0; i < numPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.classList.add('review-page');
        pageButton.addEventListener('click', () => {
            showReviewPage(i);
            reviewsSection.scrollIntoView({ behavior: "smooth" });
        });
        pageButtonsContainer.insertBefore(pageButton, nextPageButton);
    }
    previousPageButton.addEventListener('click', () => {
        showReviewPage(currentPage - 1);
        reviewsSection.scrollIntoView({ behavior: "smooth" });
    });
    nextPageButton.addEventListener('click', () => {
        showReviewPage(currentPage + 1);
        reviewsSection.scrollIntoView({ behavior: "smooth" });
    });
    // Initially show the first page
    showReviewPage(0);
});