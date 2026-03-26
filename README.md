# Premier League Brand Portal EDS (PoC)

A brand resource hub built with Adobe Edge Delivery Services (EDS) and WYSIWYG authoring. This portal provides access to brand guidelines, approved photography, templates, and other brand assets.

## Environments

- Preview: https://main--sky-brand-portal-eds--polizzigaetano.aem.page/
- Live: https://main--sky-brand-portal-eds--polizzigaetano.aem.live/    

## Features

### Custom Blocks

- **Hero Carousel** - Rotating banner with images, text, and CTAs
- **Asset Cards** - Flexible cards with centered or full-background image display
- **Quick Links** - Horizontal pill-shaped navigation buttons
- **Search** - Site-wide search bar component
- **Accordion** - Expandable content sections with rich text
- **Asset Search** - Dynamic Media asset browser with search, filters, and cart functionality
- **Sidebar Navigation** - Hierarchical navigation sidebar with expandable parent items

### Asset Search Block

The Asset Search block integrates with Adobe Dynamic Media Open API to provide:

- **Search** - Full-text search across asset metadata (title, description, tags, keywords)
- **Asset Cards** - Display AI-generated title, description, status, colors, and tags
- **Image Preview** - Thumbnails via public \`/adobe/assets/{assetId}\` endpoint with retry mechanism
- **Cart Drawer** - Slide-out cart panel for managing selected assets with improved header layout and visible close button
- **Sidebar** - Stats display with filter reset
- **Auto Token Refresh** - OAuth tokens fetched via I/O Runtime (cached for 24h)

#### Configuration (Universal Editor)

| Field | Description |
|-------|-------------|
| Delivery URL | AEM DM delivery endpoint (e.g., \`https://delivery-pXXXXX-eXXXXX.adobeaemcloud.com\`) |
| Runtime Endpoint | Adobe I/O Runtime get-token action URL |
| Client ID | X-Api-Key value for authentication |
| Page Size | Number of assets per page (default: 20) |

#### API Endpoints Used

- \`POST /adobe/assets/search\` - Search assets with query
- \`GET /adobe/assets/{assetId}\` - Public image delivery

### Adobe I/O Runtime Integration

The project includes an Adobe I/O Runtime action for secure OAuth token generation:

\`\`\`
io-runtime/
├── actions/
│   └── get-token.js    # OAuth client credentials flow
├── app.config.yaml     # Deployment configuration
├── package.json        # Dependencies
└── README.md           # Deployment instructions
\`\`\`

The \`get-token\` action:
- Fetches OAuth tokens from Adobe IMS using client credentials
- Tokens are cached client-side with 5-minute expiration buffer
- Credentials are stored securely in I/O Runtime (not exposed to browser)

See \`io-runtime/README.md\` for deployment instructions.

### Sidebar Navigation Block

The Sidebar Navigation block provides a hierarchical navigation structure:

- **Hierarchical Structure** - Supports nested navigation items with parent/child relationships
- **Expandable Sections** - Parent items with children can be expanded/collapsed
- **Active State Management** - Automatically expands parent items when a child is active
- **Fragment-Based** - Navigation structure defined in AEM via text block with nested lists
- **Collapsible** - Sidebar can be collapsed to icon-only view
- **Mobile Responsive** - Hidden by default on mobile, can be toggled open

#### Usage

1. Create a fragment page at `/sidebar-nav` in AEM
2. Add a text block with a hierarchical list structure:
   - Top-level items become main navigation items
   - Nested lists create expandable parent items with children
   - Links in list items become clickable navigation links
3. The sidebar automatically loads on all pages via `scripts/scripts.js`

#### Structure Example

\`\`\`html
<ul>
  <li>Home</li>
  <li>Sky Brand (New)</li>
  <li>MasterBand
    <ul>
      <li><a href="/tone-of-voice">Tone of Voice</a></li>
      <li><a href="/iconography">Iconography</a></li>
      <li><a href="/art-direction">Art Direction</a></li>
    </ul>
  </li>
  <li>TV Product</li>
</ul>
\`\`\`

### Theming

- Dark theme with Sage green accents (\`#00dc00\`)
- Custom Sage brand fonts (Sage Headline, Sage Text, Sage UI Icons)
- Responsive design for mobile and desktop

## Prerequisites

- Node.js 18.3.x or newer
- AEM Cloud Service release 2024.8 or newer (>= \`17465\`)
- Adobe I/O CLI (for Runtime deployment): \`npm install -g @adobe/aio-cli\`

## Installation

\`\`\`sh
npm install
\`\`\`

## Local Development

1. Install the [AEM CLI](https://github.com/adobe/helix-cli): \`npm install -g @adobe/aem-cli\`
2. Start AEM Proxy: \`aem up\` (opens your browser at \`http://localhost:3000\`)
3. Open the project in your favorite IDE and start coding

## Linting

\`\`\`sh
npm run lint
\`\`\`

## Build

\`\`\`sh
npm run build:json
\`\`\`

## Project Structure

\`\`\`
├── blocks/                 # Custom blocks
│   ├── accordion/         # Expandable content sections
│   ├── asset-cards/       # Brand asset card grid
│   ├── asset-search/      # Dynamic Media asset browser
│   ├── header/            # Site header with navigation
│   ├── footer/            # Site footer
│   ├── hero-carousel/     # Rotating hero banners
│   ├── quick-links/       # Quick navigation pills
│   ├── search/            # Search bar component
│   └── sidebar-nav/       # Hierarchical sidebar navigation
├── fonts/                  # Sage brand fonts
├── icons/                  # SVG icons
├── io-runtime/            # Adobe I/O Runtime actions
│   └── actions/           # Token generation action
├── models/                 # Universal Editor models
├── scripts/               # Core JS modules
└── styles/                # Global styles and fonts
\`\`\`

## Documentation

- [AEM Edge Delivery Services](https://www.aem.live/docs/)
- [WYSIWYG Authoring](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/authoring)
- [Creating Blocks](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/create-block)
- [Content Modelling](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/edge-delivery/wysiwyg-authoring/content-modeling)
- [Dynamic Media Open API](https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/assets/delivery/)
- [Adobe I/O Runtime](https://developer.adobe.com/runtime/docs/)