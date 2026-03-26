/**
 * Decorates the media block with image and text
 * Supports image-left or image-right variants
 * @param {Element} block The media block element
 */
export default function decorate(block) {
  // Check for imagePosition from block metadata/classes
  const hasImageRight = block.classList.contains('right') || block.dataset.imagePosition === 'right';

  // Find image and text components
  const pic = block.querySelector('picture');
  const imageWrapper = pic?.closest('div');

  if (imageWrapper) {
    imageWrapper.classList.add('media-image');

    // Get all direct children of the block
    const allContent = [...block.children];

    // Create a wrapper for proper layout
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';

    // Move all content into wrapper
    allContent.forEach((child) => {
      if (child.querySelector('picture')) {
        child.classList.add('media-image');
      } else {
        child.classList.add('media-text');
      }
      wrapper.appendChild(child);
    });

    block.appendChild(wrapper);

    // Apply image position variant
    if (hasImageRight) {
      block.classList.add('media-image-right');
    } else {
      block.classList.add('media-image-left');
    }
  }
}
