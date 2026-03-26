/**
 * Breadcrumb navigation block
 * @param {Element} block The breadcrumb block element
 */
export default function decorate(block) {
  const ul = block.querySelector('ul');

  if (ul) {
    ul.classList.add('breadcrumb-list');

    // Style list items
    const items = ul.querySelectorAll('li');
    items.forEach((item) => {
      item.classList.add('breadcrumb-item');
    });

    // Mark current page (last item or matching URL)
    const currentPath = window.location.pathname;
    const links = ul.querySelectorAll('a');

    links.forEach((link) => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
        link.closest('li')?.classList.add('active');
      }
    });

    // If no active link found, mark last item as active
    if (!ul.querySelector('.active')) {
      const lastItem = items[items.length - 1];
      if (lastItem) {
        lastItem.classList.add('active');
        const lastLink = lastItem.querySelector('a');
        if (lastLink) {
          lastLink.classList.add('active');
        }
      }
    }
  }
}
