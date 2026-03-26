# Blocks Import Verification Guide

## Summary

Successfully imported **11 new blocks** from RefDemoEDS following best practices:

1. **teaser** - Video/image hero with conditional fields
2. **tabs** - Expandable tabs with card-style variant
3. **quote** - Quote block with attribution
4. **separator** - Visual separator with style/spacing options
5. **video** - Video embed with YouTube support
6. **carousel** - Card carousel with slider functionality
7. **iframe** - Iframe embed with lazy loading
8. **action-button** - Styled action button with variants
9. **dynamic-media-image** - Dynamic Media image with transformations
10. **dynamic-media-video** - Dynamic Media video player
11. **embed-adaptive-form** - Adaptive Forms embed

**Icons Imported:** 18 total SVG icons

## Testing Checklist

### 1. Universal Editor Visibility

- [ ] Open Universal Editor on any page
- [ ] Verify all 11 new blocks appear in the component palette
- [ ] Check that blocks are grouped correctly (under "Blocks" section)
- [ ] Verify block names match expected titles:
  - Teaser
  - Tabs
  - Quote
  - Separator
  - Video
  - Carousel
  - Iframe
  - Action Button
  - Dynamic Media(Image)
  - Dynamic Media (Video)
  - Embed Adaptive Form

### 2. Block Functionality Tests

#### Teaser Block
- [ ] Add teaser block to a page
- [ ] Test image variant with swoosh effects
- [ ] Test video variant with autoplay options
- [ ] Verify conditional fields show/hide based on style selection
- [ ] Test button CTA styles (default, primary, secondary, dark)
- [ ] Verify swoosh toggle works

#### Tabs Block
- [ ] Add tabs block
- [ ] Add multiple tab items
- [ ] Test tab switching functionality
- [ ] Test card-style variant
- [ ] Verify tab items can contain images and richtext
- [ ] Check accessibility (ARIA attributes)

#### Quote Block
- [ ] Add quote block
- [ ] Test quotation field (richtext)
- [ ] Test attribution field (richtext)
- [ ] Verify citation formatting

#### Separator Block
- [ ] Add separator block
- [ ] Test style options (default, light, dark, hidden)
- [ ] Test spacing options (small, medium, large)
- [ ] Verify visual appearance

#### Video Block
- [ ] Add video block
- [ ] Test YouTube URL embedding
- [ ] Test direct video URL embedding
- [ ] Verify autoplay functionality
- [ ] Test play/pause controls

#### Carousel Block
- [ ] Add carousel block
- [ ] Add multiple card items
- [ ] Test slider navigation (prev/next buttons)
- [ ] Verify card styles work within carousel
- [ ] Test responsive behavior
- [ ] Check that icons (next.svg, prev.svg) load correctly

#### Iframe Block
- [ ] Add iframe block
- [ ] Test URL input
- [ ] Verify lazy loading (IntersectionObserver)
- [ ] Test iframe rendering

#### Action Button Block
- [ ] Add action button block
- [ ] Test link field
- [ ] Test label field
- [ ] Test style variants (default, secondary, dark)
- [ ] Verify button styling

#### Dynamic Media Image Block
- [ ] Add dynamic-media-image block
- [ ] Test custom asset picker
- [ ] Test rotation options (30, 45, 60, 90, etc.)
- [ ] Test flip options (vertical, horizontal, both)
- [ ] Test crop parameter input

#### Dynamic Media Video Block
- [ ] Add dynamic-media-video block
- [ ] Test custom asset picker for video
- [ ] Test autoplay boolean
- [ ] Test loop boolean
- [ ] Test muted boolean
- [ ] Verify DM VideoViewer integration (requires window.dmviewers)

#### Embed Adaptive Form Block
- [ ] Add embed-adaptive-form block
- [ ] Test form path input (should validate /content/forms/af)
- [ ] Verify lazy loading
- [ ] Test form rendering

### 3. Component Definition Verification

- [ ] Verify `component-definition.json` includes all 11 blocks
- [ ] Verify `component-filters.json` includes blocks in "section" components
- [ ] Verify `component-models.json` includes all model definitions
- [ ] Check that models use correct field types:
  - `richtext` for rich text content
  - `reference` for image/video references
  - `select` for dropdown options
  - `boolean` for true/false options
  - `text` for simple text
  - `container` for grouped fields
  - `custom-asset-namespace:custom-asset` for Dynamic Media

### 4. Pattern Compliance

Verify all blocks follow RefDemoEDS patterns:

- [ ] **Model Pattern**: Blocks with structured data use `"model": "block-name"`
- [ ] **Filter Pattern**: Blocks with child components use `"filter": "block-name"`
- [ ] **Both Patterns**: Blocks like tabs use both model and filter
- [ ] **Key-Value**: Teaser block includes `"key-value": true`
- [ ] **Conditional Fields**: Teaser has conditional video/image properties
- [ ] **Container Fields**: Teaser uses container fields for grouping
- [ ] **Rich Field Types**: All appropriate fields use richtext, reference, select, boolean

### 5. Icon Verification

- [ ] Verify all icons load correctly:
  - video-play.svg, video-pause.svg (teaser/video blocks)
  - next.svg, prev.svg (carousel navigation)
  - teaser_innerswoosh.svg, teaser_outerswoosh.svg (teaser effects)
  - aem.svg, cancel.svg, close.svg (general UI)
  - flag-*.svg (currency flags)
  - search-light.svg, search-white.svg (search variants)
  - video_play.svg (alternative video icon)

### 6. CSS Styling

- [ ] Verify all blocks have proper CSS files
- [ ] Test responsive behavior on mobile/tablet/desktop
- [ ] Check for CSS variable usage (var(--main-accent-color), etc.)
- [ ] Verify no console errors related to missing styles

### 7. JavaScript Functionality

- [ ] Verify all blocks have proper JS files
- [ ] Check browser console for JavaScript errors
- [ ] Test interactive features (tabs switching, carousel navigation, etc.)
- [ ] Verify lazy loading works (iframe, embed-adaptive-form)
- [ ] Test video player functionality

### 8. Refactored Blocks

#### Cards Block
- [ ] Verify cards block still works with existing content
- [ ] Test new CTA style field
- [ ] Test card style variants (image-top, image-bottom, image-left, image-right, teaser-overlay, teaser-card)
- [ ] Verify style detection from third div works correctly

## Common Issues & Solutions

### Issue: Block not appearing in Universal Editor
**Solution**: 
- Check `component-definition.json` has the block definition
- Check `component-filters.json` includes block in "section" components
- Verify block JSON file exists and is valid
- Run `npm run build:json` to regenerate component files

### Issue: Model fields not showing
**Solution**:
- Check `component-models.json` has the model definition
- Verify field component types are correct
- Check for JSON syntax errors

### Issue: Icons not loading
**Solution**:
- Verify icon files exist in `icons/` directory
- Check icon paths in JavaScript (should use `${window.hlx.codeBasePath}/icons/`)
- Verify SVG files are valid

### Issue: Dynamic Media blocks not working
**Solution**:
- Ensure `window.dmviewers` is available (requires Dynamic Media SDK)
- Check custom asset namespace is configured
- Verify config URLs are correct (`/content/dam/config/image.config.json`)

### Issue: Carousel slider not working
**Solution**:
- Verify `slider.js` is loaded
- Check `slider.css` is included
- Verify next.svg and prev.svg icons exist
- Check browser console for errors

## Next Steps

1. **Test in Universal Editor**: Add each block to a test page and verify functionality
2. **Content Authoring**: Test authoring workflow for each block
3. **Performance**: Check page load times with multiple blocks
4. **Accessibility**: Verify ARIA attributes and keyboard navigation
5. **Browser Testing**: Test in Chrome, Firefox, Safari, Edge
6. **Mobile Testing**: Verify responsive behavior on mobile devices

## Files Modified/Created

### New Block Directories
- `blocks/teaser/`
- `blocks/tabs/`
- `blocks/quote/`
- `blocks/separator/`
- `blocks/video/`
- `blocks/carousel/`
- `blocks/iframe/`
- `blocks/action-button/`
- `blocks/dynamic-media-image/`
- `blocks/dynamic-media-video/`
- `blocks/embed-adaptive-form/`

### New Utility Files
- `scripts/dom-helpers.js`
- `scripts/slider.js`
- `styles/slider.css`

### Updated Files
- `component-definition.json`
- `component-filters.json`
- `component-models.json`
- `blocks/cards/_cards.json`
- `blocks/cards/cards.js`
- `blocks/cards/cards.css`

### Icons Added
18 SVG icons in `icons/` directory

## Commit History

- `fc51af2` - Initial import of 8 blocks and utilities
- `24ebfd2` - Complete import of remaining 3 blocks and all icons
