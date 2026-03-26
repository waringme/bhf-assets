import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Asset Cards Block
 * Displays a grid of clickable asset category cards with images and labels.
 * Supports 2, 3, or 4 column layouts via block variants.
 *
 * Block structure from Universal Editor:
 * - Each card row contains: title, titleType, image, imageDisplay, link
 *
 * Image Display options:
 * - centered (default): Image centered below title
 * - fullbackground: Image as full background with title overlay on left
 *
 * Variants:
 * - asset-cards (default): auto-fit grid
 * - asset-cards-2-cols: 2 column layout
 * - asset-cards-3-cols: 3 column layout
 * - asset-cards-4-cols: 4 column layout
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Check for section title in the first row (if it's a heading)
  let sectionTitle = null;
  let startIndex = 0;

  if (rows.length > 0) {
    const firstRow = rows[0];
    const heading = firstRow.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && !firstRow.querySelector('picture, img')) {
      sectionTitle = heading.cloneNode(true);
      sectionTitle.className = 'asset-cards-title';
      startIndex = 1;
    }
  }

  const cards = document.createElement('ul');
  cards.className = 'asset-cards-grid';

  // Process card rows
  // Expected column order from Universal Editor model:
  // 0: title, 1: titleType, 2: image, 3: imageDisplay, 4: link
  rows.slice(startIndex).forEach((row) => {
    const card = document.createElement('li');
    card.className = 'asset-card';
    moveInstrumentation(row, card);

    const cols = [...row.children];

    // Find the image
    const picture = row.querySelector('picture');

    // Find link (usually in the last column)
    const link = row.querySelector('a');

    // Check for imageDisplay setting (look for 'fullbackground' text in cells)
    let isFullBackground = false;
    cols.forEach((col) => {
      const text = col.textContent.trim().toLowerCase();
      if (text === 'fullbackground' || text === 'full background') {
        isFullBackground = true;
      }
    });

    // Add class for full background mode
    if (isFullBackground) {
      card.classList.add('asset-card-fullbg');
    }

    // Find the title - prioritize first column (title field) or heading element
    let labelText = '';
    let titleTagName = 'h3'; // default

    // First, check for heading element anywhere in the row
    const heading = row.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) {
      labelText = heading.textContent.trim();
      titleTagName = heading.tagName.toLowerCase();
    }

    // If no heading, look for title in first column (excluding known field values)
    if (!labelText && cols.length > 0) {
      const firstCol = cols[0];
      // Skip if first column contains image, heading, or link
      if (!firstCol.querySelector('picture, img, h1, h2, h3, h4, h5, h6, a')) {
        const text = firstCol.textContent.trim();
        // Skip display mode values and heading type values
        const skipValues = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'centered', 'fullbackground', 'full background'];
        if (text && !skipValues.includes(text.toLowerCase())) {
          labelText = text;
        }
      }
    }

    // Check second column for titleType (h3, h4, h5, h6)
    if (cols.length > 1) {
      const secondCol = cols[1];
      const typeText = secondCol.textContent.trim().toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(typeText)) {
        titleTagName = typeText;
      }
    }

    // Build card structure
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'asset-card-content';

    // Create title/label element
    if (labelText) {
      const titleElement = document.createElement(titleTagName);
      titleElement.className = 'asset-card-label';
      titleElement.textContent = labelText;
      contentWrapper.appendChild(titleElement);
    }

    // Create image wrapper
    let imageWrapper = null;
    if (picture) {
      imageWrapper = document.createElement('div');
      imageWrapper.className = 'asset-card-image';
      imageWrapper.appendChild(picture.cloneNode(true));
    }

    // Assemble card with or without link
    if (link) {
      const cardLink = document.createElement('a');
      cardLink.href = link.href;
      cardLink.className = 'asset-card-link';
      cardLink.setAttribute('aria-label', labelText || 'View card');

      // For full background, image comes first (behind content)
      if (isFullBackground && imageWrapper) {
        cardLink.appendChild(imageWrapper);
      }
      cardLink.appendChild(contentWrapper);
      // For centered mode, image comes after content
      if (!isFullBackground && imageWrapper) {
        cardLink.appendChild(imageWrapper);
      }
      card.appendChild(cardLink);
    } else {
      if (isFullBackground && imageWrapper) {
        card.appendChild(imageWrapper);
      }
      card.appendChild(contentWrapper);
      if (!isFullBackground && imageWrapper) {
        card.appendChild(imageWrapper);
      }
    }

    cards.appendChild(card);
  });

  block.textContent = '';

  // Add section title if present
  if (sectionTitle) {
    block.appendChild(sectionTitle);
  }

  block.appendChild(cards);
}
