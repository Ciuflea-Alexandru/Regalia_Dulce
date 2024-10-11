function truncateText(element) {
  const text = element.textContent;
  const lines = text.split(/\r?\n/); // Split text into lines, handling both Windows and Unix line breaks

  if (lines.length > 4) {
    // Truncate text after the fourth line
    const truncatedText = lines.slice(0, 4).join("\n") + "...";
    element.textContent = truncatedText;
  }
}

// Find all product card elements
const productCards = document.querySelectorAll(".product-card");

// Apply text truncation to each product card
productCards.forEach(truncateText);