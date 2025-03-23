document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slides img'); // Select all slide images
    const prevSlide = document.querySelector('.prev-slide');
    const nextSlide = document.querySelector('.next-slide');
    let currentIndex = 0;

    // Function to update the slide visibility
    function showSlide(index) {
        const slideContainer = document.querySelector('.slides');
        slideContainer.style.transform = `translateX(-${index * 100}%)`; // Shift slides based on the index
    }

    // Function to change the slide automatically
    function changeSlide() {
        currentIndex = (currentIndex === slides.length - 1) ? 0 : currentIndex + 1;
        showSlide(currentIndex);
    }

    // Event listeners for navigation buttons
    prevSlide.addEventListener('click', () => {
        currentIndex = (currentIndex === 0) ? slides.length - 1 : currentIndex - 1;
        showSlide(currentIndex);
    });

    nextSlide.addEventListener('click', () => {
        currentIndex = (currentIndex === slides.length - 1) ? 0 : currentIndex + 1;
        showSlide(currentIndex);
    });

    // Automatically change the slide every minute (60000 milliseconds)
    setInterval(changeSlide, 10000);

    // Initialize the first slide to be visible
    showSlide(currentIndex);
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
