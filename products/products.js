window.onload = function () {
  // Verify DOM elements
  const slider = document.querySelector('.slider');
  const leftArrow = document.querySelector('.slider-arrow.left');
  const rightArrow = document.querySelector('.slider-arrow.right');
  
  if (!slider || !leftArrow || !rightArrow) {
    console.error('Slider elements not found:', { slider, leftArrow, rightArrow });
    return;
  }

  const cardWidth = 250;
  const gap = 32; // Matches the CSS gap (2rem = 32px at default font size)
  let cardsPerView = 4;
  const scrollDistance = cardWidth + gap; // 282px for 1 card
  let isDragging = false;
  let startX;
  let scrollLeft;
  let isScrolling = false; // Prevent rapid clicks

  // Total number of cards
  const totalCards = document.querySelectorAll('.product-card').length;
  console.log('Total cards:', totalCards);
  if (totalCards === 0) {
    console.error('No product cards found');
    return;
  }

  // Adjust cardsPerView based on viewport width (affects viewport width, not scroll distance)
  function updateSliderSettings() {
    if (window.innerWidth < 600) {
      cardsPerView = 1;
    } else if (window.innerWidth < 768) {
      cardsPerView = 2;
    } else {
      cardsPerView = 4;
    }
    console.log('Cards per view:', cardsPerView);
    // Ensure slider starts at the beginning after resize
    slider.scrollLeft = 0;
  }

  updateSliderSettings();
  window.addEventListener('resize', updateSliderSettings);

  // Arrow navigation: move one card at a time
  leftArrow.addEventListener('click', () => {
    if (isScrolling) {
      console.log('Left arrow click ignored: scrolling in progress');
      return;
    }
    isScrolling = true;
    let newScrollPosition = slider.scrollLeft - scrollDistance;
    // Prevent scrolling beyond the start
    newScrollPosition = Math.max(newScrollPosition, 0);
    console.log('Left arrow clicked, new scroll position:', newScrollPosition);
    slider.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    setTimeout(() => {
      isScrolling = false;
      console.log('Left scroll complete, current scrollLeft:', slider.scrollLeft);
    }, 300);
  });

  rightArrow.addEventListener('click', () => {
    if (isScrolling) {
      console.log('Right arrow click ignored: scrolling in progress');
      return;
    }
    isScrolling = true;
    let newScrollPosition = slider.scrollLeft + scrollDistance;
    // Prevent scrolling beyond the end
    const maxScroll = (totalCards - cardsPerView) * scrollDistance;
    newScrollPosition = Math.min(newScrollPosition, maxScroll);
    console.log('Right arrow clicked, new scroll position:', newScrollPosition);
    slider.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
    setTimeout(() => {
      isScrolling = false;
      console.log('Right scroll complete, current scrollLeft:', slider.scrollLeft);
    }, 300);
  });

  // Touch swiping
  slider.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    slider.classList.add('dragging');
    console.log('Mouse down, startX:', startX, 'scrollLeft:', scrollLeft);
  });

  slider.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = x - startX;
    slider.scrollLeft = scrollLeft - walk;
    console.log('Mouse move, current scrollLeft:', slider.scrollLeft);
  });

  slider.addEventListener('mouseup', () => {
    isDragging = false;
    slider.classList.remove('dragging');
    snapToNearestCard();
  });

  slider.addEventListener('mouseleave', () => {
    if (isDragging) {
      isDragging = false;
      slider.classList.remove('dragging');
      snapToNearestCard();
    }
  });

  // Touch events for mobile
  slider.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
    console.log('Touch start, startX:', startX, 'scrollLeft:', scrollLeft);
  });

  slider.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = x - startX;
    slider.scrollLeft = scrollLeft - walk;
    console.log('Touch move, current scrollLeft:', slider.scrollLeft);
  });

  slider.addEventListener('touchend', () => {
    isDragging = false;
    snapToNearestCard();
  });

  // Snap to the nearest individual card
  function snapToNearestCard() {
    const scrollPosition = slider.scrollLeft;
    const cardDistance = cardWidth + gap; // 282px per card
    const nearestCardIndex = Math.round(scrollPosition / cardDistance);
    // Ensure we don't scroll beyond bounds
    const maxIndex = totalCards - cardsPerView;
    const boundedIndex = Math.max(0, Math.min(nearestCardIndex, maxIndex));
    const newScrollPosition = boundedIndex * cardDistance;
    console.log('Snapping to card index:', boundedIndex, 'position:', newScrollPosition);
    slider.scrollTo({ left: newScrollPosition, behavior: 'smooth' });
  }
};