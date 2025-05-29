document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slides img');
    const slideIndicatorsContainer = document.querySelector('.slide-indicators');
    const downArrow = document.querySelector('.down-arrow');
    const slideshow = document.querySelector('.promotion-slideshow');

    let currentIndex = 0;
    let autoSlideInterval;

    function showSlide(index) {
        const slideContainer = document.querySelector('.slides');
        slideContainer.style.transform = `translateX(-${index * 99.5}%)`;

        const indicators = document.querySelectorAll('.slide-indicator');
        indicators.forEach(indicator => {
            indicator.classList.remove('active');
        });
        indicators[index].classList.add('active');
    }

    // Function to change the slide automatically
    function changeSlide() {
        currentIndex = (currentIndex === slides.length - 1) ? 0 : currentIndex + 1;
        showSlide(currentIndex);
    }

    // Function to reset the auto-change timer
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        autoSlideInterval = setInterval(changeSlide, 10000);
    }

    downArrow.addEventListener('click', () => {
        window.scrollTo({
            top:  slideshow.offsetHeight + 70,
            behavior: 'smooth'
        });
    });

    slides.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('slide-indicator');
        indicator.addEventListener('click', () => {
            currentIndex = index;
            showSlide(currentIndex);
            resetAutoSlide();
        });
        slideIndicatorsContainer.appendChild(indicator);
    });

    autoSlideInterval = setInterval(changeSlide, 10000);
    showSlide(currentIndex);
});

window.addEventListener('scroll', () => {
    const section = document.querySelector('.site-description-section');
    const images = document.querySelectorAll('.site-image-1, .site-image-2, .site-image-3');

    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const windowBottom = window.scrollY + window.innerHeight;

    images.forEach((img) => {
        const imgTop = img.getBoundingClientRect().top + window.scrollY;
        const imgBottom = imgTop + img.offsetHeight;

        // Fade in + slide in if the image is in the section's view area
        if (windowBottom > imgTop + 100 && window.scrollY < imgBottom - 100) {
            img.classList.add('fade-in');
            img.classList.remove('fade-out');
        }
        // Fade out + slide out if you scroll past the image
        else if (window.scrollY > imgBottom + 100) {
            img.classList.add('fade-out');
            img.classList.remove('fade-in');
        }
        // If scroll is not in range, reset to invisible (for smooth re-entry)
        else {
            img.classList.remove('fade-in', 'fade-out');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const productGrids = document.querySelectorAll('.product-grid');

  productGrids.forEach((productGrid, index) => {
    const cardWidth = productGrid.querySelector('.product-card').offsetWidth;
    const computedStyle = window.getComputedStyle(productGrid);
    const gapSize = parseInt(computedStyle.getPropertyValue('gap'));
    const totalCards = productGrid.querySelectorAll('.product-card').length;
    const cardsPerStack = 5;
    let currentStack = 0;

    // Calculate the total width of a stack, including gaps
    const stackWidth = (cardWidth + gapSize) * cardsPerStack;

    // Function to update the scroll position
    const updateScroll = () => {
      productGrid.scrollLeft = currentStack * stackWidth;
    };

    // Function to update arrow visibility
    const updateArrowVisibility = () => {
      const prevArrow = productGrid.querySelector('.prev-arrow');
      const nextArrow = productGrid.querySelector('.next-arrow');

      prevArrow.classList.toggle('hidden', currentStack === 0);
      nextArrow.classList.toggle('hidden', currentStack >= Math.ceil(totalCards / cardsPerStack) - 1);
    };

    updateArrowVisibility();

    productGrid.querySelector('.next-arrow').addEventListener('click', () => {
      if (currentStack < Math.ceil(totalCards / cardsPerStack) - 1) {
        currentStack++;
        updateScroll();
      }
      updateArrowVisibility();
    });

    productGrid.querySelector('.prev-arrow').addEventListener('click', () => {
      if (currentStack > 0) {
        currentStack--;
        updateScroll();
      }
      updateArrowVisibility();
    });
  });
});

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
