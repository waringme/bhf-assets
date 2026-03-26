import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Quick Links Block
 * Displays horizontal pill-shaped buttons for popular/quick access items.
 *
 * Block structure:
 * - Each row in the block becomes a quick link pill
 * - Contains a link with text
 *
 * Usage in document:
 * | Quick Links |
 * | [PPT Template](/path/to/ppt) |
 * | [Sage Font](/path/to/font) |
 * | [Sage Master Logo](/path/to/logo) |
 */
export default function decorate(block) {
  const links = document.createElement('ul');
  links.className = 'quick-links-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'quick-link-item';
    moveInstrumentation(row, li);

    // Find the link in the row
    const link = row.querySelector('a');
    if (link) {
      link.className = 'quick-link';
      li.appendChild(link.cloneNode(true));
    } else {
      // If no link, just use the text content
      const text = row.textContent.trim();
      if (text) {
        const span = document.createElement('span');
        span.className = 'quick-link quick-link-text';
        span.textContent = text;
        li.appendChild(span);
      }
    }

    if (li.hasChildNodes()) {
      links.appendChild(li);
    }
  });

  block.textContent = '';
  block.appendChild(links);
}
