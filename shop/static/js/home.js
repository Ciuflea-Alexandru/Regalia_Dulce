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
    const nextArrows = document.querySelectorAll('.next-arrow');
    const prevArrows = document.querySelectorAll('.prev-arrow');

    productGrids.forEach((productGrid, index) => {
        const cardWidth = productGrid.querySelector('.product-card').offsetWidth;
        const totalCards = productGrid.querySelectorAll('.product-card').length;
        const cardsPerStack = 6;
        let currentStack = 0;

        // Function to update arrow visibility
        const updateArrowVisibility = () => {
            prevArrows[index].classList.toggle('hidden', currentStack === 0);
            nextArrows[index].classList.toggle('hidden', currentStack >= Math.ceil(totalCards / cardsPerStack) - 1);
        };

        updateArrowVisibility();

        nextArrows[index].addEventListener('click', () => {
            if (currentStack < Math.ceil(totalCards / cardsPerStack) - 1) {
                currentStack++;
                productGrid.scrollLeft += 2000;
            }
            updateArrowVisibility();
        });

        prevArrows[index].addEventListener('click', () => {
            if (currentStack > 0) {
                currentStack--;
                productGrid.scrollLeft -= 2000;
            }
            updateArrowVisibility();
        });
    });
});
