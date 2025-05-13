document.addEventListener('DOMContentLoaded', function () {
    const slider = document.querySelector('.slider');
    const leftArrow = document.querySelector('.slider-arrow.left');
    const rightArrow = document.querySelector('.slider-arrow.right');
    const cardWidth = document.querySelector('.product-card').offsetWidth;
    const gap = 32; // Matches the CSS gap (2rem = 32px at default font size)
    let isDragging = false;
    let startX;
    let scrollLeft;
  
    // Arrow navigation
    leftArrow.addEventListener('click', () => {
      slider.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' });
    });
  
    rightArrow.addEventListener('click', () => {
      slider.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
    });
  
    // Touch swiping
    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      slider.classList.add('dragging');
    });
  
    slider.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5; // Adjust sensitivity
      slider.scrollLeft = scrollLeft - walk;
    });
  
    slider.addEventListener('mouseup', () => {
      isDragging = false;
      slider.classList.remove('dragging');
    });
  
    slider.addEventListener('mouseleave', () => {
      isDragging = false;
      slider.classList.remove('dragging');
    });
  
    // Touch events for mobile
    slider.addEventListener('touchstart', (e) => {
      isDragging = true;
      startX = e.touches[0].pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    });
  
    slider.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5;
      slider.scrollLeft = scrollLeft - walk;
    });
  
    slider.addEventListener('touchend', () => {
      isDragging = false;
    });
  });