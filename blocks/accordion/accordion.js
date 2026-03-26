import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accordion Block
 * Creates an expandable/collapsible accordion with multiple items
 * Each item has a title and content area
 */
export default function decorate(block) {
  const accordion = document.createElement('div');
  accordion.className = 'accordion-container';

  // Process each row as an accordion item
  [...block.children].forEach((row, index) => {
    const item = document.createElement('div');
    item.className = 'accordion-item';
    moveInstrumentation(row, item);

    const cols = [...row.children];

    // First column is the title
    const titleText = cols[0]?.textContent?.trim() || `Item ${index + 1}`;

    // Second column is the content
    const contentEl = cols[1];

    // Create header (clickable title area)
    const header = document.createElement('button');
    header.className = 'accordion-header';
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `accordion-content-${index}`);
    header.setAttribute('id', `accordion-header-${index}`);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'accordion-title';
    titleSpan.textContent = titleText;

    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    icon.setAttribute('aria-hidden', 'true');

    header.appendChild(titleSpan);
    header.appendChild(icon);

    // Create content panel
    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.setAttribute('id', `accordion-content-${index}`);
    content.setAttribute('role', 'region');
    content.setAttribute('aria-labelledby', `accordion-header-${index}`);
    content.hidden = true;

    if (contentEl) {
      // Move all child nodes from the content column
      while (contentEl.firstChild) {
        content.appendChild(contentEl.firstChild);
      }
    }

    // Toggle functionality
    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      // Toggle current item
      header.setAttribute('aria-expanded', !isExpanded);
      content.hidden = isExpanded;
      item.classList.toggle('is-open', !isExpanded);
    });

    // Keyboard navigation
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });

    item.appendChild(header);
    item.appendChild(content);
    accordion.appendChild(item);
  });

  block.textContent = '';
  block.appendChild(accordion);
}
