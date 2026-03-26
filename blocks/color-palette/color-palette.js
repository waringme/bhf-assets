import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Color Palette Block
 * Displays a horizontal row of color swatches with an optional label.
 *
 * Universal Editor Structure:
 * - Block has a "label" property (optional)
 * - Each row is a Color Swatch item with a "color" property
 *
 * Usage in Universal Editor:
 * 1. Add a Color Palette block
 * 2. Set the label (optional): "Colour", "Primary Colors", etc.
 * 3. Add Color Swatch items with hex color codes: #004A8F, #6B7280, #C5C5C5
 *
 * For document authoring (table format):
 * | Color Palette |
 * | Label (optional) |
 * | #004A8F |
 * | #6B7280 |
 * | #C5C5C5 |
 */
export default function decorate(block) {
  const container = document.createElement('div');
  container.className = 'color-palette-container';

  // Get label from block's first row if it exists and is not a color
  let label = null;
  const rows = [...block.children];

  // Create color swatches container
  const swatchesContainer = document.createElement('div');
  swatchesContainer.className = 'color-swatches';

  // Process each row as a color swatch
  rows.forEach((row) => {
    const cells = [...row.children];
    
    // Get the color value from the first cell
    const colorText = cells[0]?.textContent?.trim();
    
    if (!colorText) return;

    // Check if this is a label (first row, not a color)
    if (!label && !colorText.startsWith('#') && !colorText.startsWith('rgb') && !colorText.startsWith('hsl')) {
      // Check if it looks like a hex color without #
      if (!/^[0-9A-Fa-f]{6}$/.test(colorText)) {
        label = colorText;
        return;
      }
    }

    // Create color swatch
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    moveInstrumentation(row, swatch);
    
    // Normalize color value
    let colorValue = colorText;
    if (!colorText.startsWith('#') && !colorText.startsWith('rgb') && !colorText.startsWith('hsl')) {
      // If it's a 6-char hex without #, add it
      if (/^[0-9A-Fa-f]{6}$/.test(colorText)) {
        colorValue = `#${colorText}`;
      }
    }
    
    swatch.style.backgroundColor = colorValue;
    swatch.setAttribute('data-color', colorText);
    swatch.setAttribute('title', colorText);
    
    // Add click to copy functionality
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(colorText).then(() => {
        // Show copied feedback
        swatch.classList.add('copied');
        setTimeout(() => swatch.classList.remove('copied'), 1000);
      }).catch(() => {
        // Fallback if clipboard API not available
        console.log('Copy to clipboard not available');
      });
    });

    swatchesContainer.appendChild(swatch);
  });

  // Only add swatches container if we have swatches
  if (swatchesContainer.children.length > 0) {
    container.appendChild(swatchesContainer);
  }

  // Create label if exists
  if (label) {
    const labelElement = document.createElement('p');
    labelElement.className = 'color-palette-label';
    labelElement.textContent = label;
    container.appendChild(labelElement);
  }

  // Move instrumentation and replace block content
  moveInstrumentation(block, container);
  block.textContent = '';
  block.appendChild(container);
}
