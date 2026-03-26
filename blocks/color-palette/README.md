# Color Palette Block

## Overview
A flexible color swatch component that displays color palettes with clickable swatches. Perfect for brand guidelines, design systems, and color documentation.

## Features
- **Editable Color Fields**: Each color swatch has its own editable color code field
- **Optional Label**: Add a label to describe the palette
- **Click to Copy**: Click any swatch to copy the color code to clipboard
- **Visual Feedback**: Checkmark animation confirms successful copy
- **Hover Effects**: Swatches scale on hover for better interactivity
- **Responsive**: Adapts to mobile and desktop views
- **Variants**: Multiple display options (default, compact, square, large, no-border)

## Usage in AEM Universal Editor

### Adding a Color Palette

1. Add a "Color Palette" block to your page or column
2. (Optional) Set the "Label" field (e.g., "Colour", "Primary Colors")
3. Add "Color Swatch" items to the palette
4. For each swatch, set the "Color Code" field with a hex value (e.g., `#004A8F`)
5. Select a variant from the block properties if desired

### Block Properties

**Color Palette Block:**
- **Label** (optional): Text label displayed below the swatches (e.g., "Colour", "Brand Colors")
- **Variant** (optional): Display style - Default, Compact, Square, Large, or No Border

**Color Swatch Item:**
- **Color Code** (required): Hexadecimal color value (e.g., `#004A8F`, `#6B7280`, `#C5C5C5`)

### Content Structure (Document Authoring)

For table-based authoring in documents:

```
| Color Palette |
| Colour |
| #004A8F |
| #6B7280 |
| #C5C5C5 |
```

First row with non-color text becomes the label. Subsequent rows are color swatches.

## Variants

Apply variants in the Universal Editor block settings:

- **Default**: Standard size with 1:1.5 aspect ratio
- **Compact**: Smaller swatches for space-constrained layouts
- **Square**: Equal width and height swatches (1:1 ratio)
- **Large**: Larger swatches for prominent display
- **No Border**: Removes container border for seamless integration

## Color Format

Color codes should be hexadecimal values:
- **With hash**: `#004A8F` (recommended)
- **Without hash**: `004A8F` (automatically converted to `#004A8F`)

The block also supports (but primarily designed for hex):
- **RGB**: `rgb(0, 74, 143)`
- **RGBA**: `rgba(0, 74, 143, 0.8)`
- **HSL**: `hsl(210, 100%, 28%)`

## Styling

The block uses CSS custom properties from your theme:
- `--background-color`: Container background
- `--border-color`: Container and swatch borders
- `--text-color`: Label text color
- `--transition-fast`: Hover animation speed

## Files

- `blocks/color-palette/color-palette.js` - Block decoration logic
- `blocks/color-palette/color-palette.css` - Styling and variants
- `blocks/color-palette/_color-palette.json` - Universal Editor model

## Interactive Features

### Click to Copy
Click any color swatch to copy its color code to your clipboard. A checkmark animation confirms the copy action.

### Hover Effect
Swatches scale up slightly on hover with a subtle shadow, making it easy to identify which color you're about to copy.

## Using in Columns

The Color Palette block can be added inside Column blocks, allowing you to create side-by-side color palette comparisons or multi-column brand color layouts.

## Accessibility

- Color values are added to `title` attributes for screen readers
- Proper cursor indication (pointer) on interactive swatches
- Sufficient contrast for label text
- Keyboard-accessible copy functionality
