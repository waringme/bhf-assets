import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hero Carousel Block
 * Displays a rotating banner with slides containing text, images, and CTAs.
 *
 * Block structure:
 * - Each row in the block becomes a slide
 * - First column: text content (title, description, CTA button)
 * - Second column: image/graphic
 *
 * Features:
 * - Auto-advances every 5 seconds
 * - Dot navigation indicators
 * - Pause on hover
 */

const SLIDE_INTERVAL = 5000; // 5 seconds

export default function decorate(block) {
  const slides = [...block.children];
  if (slides.length === 0) return;

  // Create carousel structure
  const carousel = document.createElement('div');
  carousel.className = 'hero-carousel-container';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'hero-carousel-slides';

  // Carousel functionality
  let currentSlide = 0;
  let intervalId = null;
  let isPaused = false;

  function goToSlide(index) {
    const allSlides = block.querySelectorAll('.hero-carousel-slide');
    const allDots = block.querySelectorAll('.hero-carousel-dot');

    allSlides.forEach((s) => s.classList.remove('active'));
    allDots.forEach((d) => d.classList.remove('active'));

    currentSlide = index;
    allSlides[currentSlide]?.classList.add('active');
    allDots[currentSlide]?.classList.add('active');
  }

  function nextSlide() {
    const next = (currentSlide + 1) % slides.length;
    goToSlide(next);
  }

  function startAutoPlay() {
    if (slides.length > 1 && !intervalId) {
      intervalId = setInterval(() => {
        if (!isPaused) {
          nextSlide();
        }
      }, SLIDE_INTERVAL);
    }
  }

  function stopAutoPlay() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // Process each slide
  slides.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = 'hero-carousel-slide';
    slideEl.dataset.slideIndex = index;
    if (index === 0) slideEl.classList.add('active');
    moveInstrumentation(slide, slideEl);

    const cols = [...slide.children];

    // Text content (first column or only column)
    const textCol = cols[0];
    if (textCol) {
      const textWrapper = document.createElement('div');
      textWrapper.className = 'hero-carousel-text';

      // Clone content maintaining structure
      [...textCol.children].forEach((child) => {
        const cloned = child.cloneNode(true);
        // Style buttons
        const buttons = cloned.querySelectorAll('a');
        buttons.forEach((btn) => {
          if (!btn.classList.contains('button')) {
            btn.classList.add('button');
          }
        });
        textWrapper.appendChild(cloned);
      });

      // If no children but has text content
      if (textCol.children.length === 0 && textCol.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = textCol.textContent.trim();
        textWrapper.appendChild(p);
      }

      slideEl.appendChild(textWrapper);
    }

    // Image/graphic content (second column)
    const imageCol = cols[1];
    if (imageCol) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'hero-carousel-image';

      const picture = imageCol.querySelector('picture');
      if (picture) {
        imageWrapper.appendChild(picture.cloneNode(true));
      } else {
        // If no picture, clone all content (could be SVG or other graphics)
        imageWrapper.innerHTML = imageCol.innerHTML;
      }

      slideEl.appendChild(imageWrapper);
    }

    slidesWrapper.appendChild(slideEl);
  });

  carousel.appendChild(slidesWrapper);

  // Create dot navigation if more than one slide
  if (slides.length > 1) {
    const dotsWrapper = document.createElement('div');
    dotsWrapper.className = 'hero-carousel-dots';

    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'hero-carousel-dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.dataset.slideIndex = index;
      if (index === 0) dot.classList.add('active');

      dot.addEventListener('click', () => {
        goToSlide(index);
      });

      dotsWrapper.appendChild(dot);
    });

    carousel.appendChild(dotsWrapper);
  }

  block.textContent = '';
  block.appendChild(carousel);

  // Pause on hover
  carousel.addEventListener('mouseenter', () => {
    isPaused = true;
  });

  carousel.addEventListener('mouseleave', () => {
    isPaused = false;
  });

  // Start auto-play
  startAutoPlay();

  // Cleanup on page navigation (for SPAs)
  window.addEventListener('beforeunload', stopAutoPlay);
}
