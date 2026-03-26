# Media Block Usage Guide

## How to Use the Media Block in Universal Editor

The Media block allows you to create a side-by-side layout with an image and text content.

### Adding a Media Block:

1. **Add the Media Block** to a section
2. **Choose Image Position** (Left or Right) in the block properties
3. **Add Components** to the block:
   - Add an **Image** component (your photo/graphic)
   - Add **Title** and **Text** components (your content)
   - Optionally add **Button** components (CTAs)

### Layout Options:

#### Option A: Image on Left
1. Add Media block
2. Set "Image Position" to **Left**
3. Add your components (image, title, text) - the JavaScript will automatically position them

#### Option B: Image on Right
1. Add Media block  
2. Set "Image Position" to **Right**
3. Add your components - the image will appear on the right side

### Allowed Components Inside Media Block:
- **Image** - Your photo or graphic
- **Title** - Main heading (h2 or h3)
- **Text** - Body paragraphs
- **Button** - Call-to-action links

### Example Content Structure:

```
Media Block (Image Position: Right)
├── Title: "Planning something new?"
├── Text: "Refreshing something old? We can help..."
├── Text: "Our Brand Reviews are every Tuesday..."
├── Image: office-photo.jpg
```

The block automatically:
- Positions image and text based on the Image Position setting
- Stacks content vertically on mobile
- Displays side-by-side on desktop
- Applies rounded corners to images
- Maintains proper spacing and typography

### Tips:
- Images work best at 800x600px or larger
- Keep text concise for better readability
- Use the Title component for your main heading
- The image position setting overrides the visual order
