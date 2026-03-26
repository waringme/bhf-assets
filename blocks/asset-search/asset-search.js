/**
 * Asset Search Block
 * Search and browse Dynamic Media assets with filters, grid view, and cart functionality.
 * Integrates with AEM Dynamic Media Open API.
 */

// No external imports needed - block parses its own configuration

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Block configuration - populated from Universal Editor
 * @type {Object}
 */
const CONFIG = {
  deliveryUrl: '',
  runtimeEndpoint: '',
  clientId: '',
  pageSize: 20,
};

/**
 * Token cache for storing the access token
 * @type {Object}
 */
const TOKEN_CACHE = {
  accessToken: null,
  expiresAt: 0,
};

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Application state
 * @type {Object}
 */
const STATE = {
  assets: [],
  cart: [],
  searchQuery: '',
  activeFilters: {
    color: null,
    category: null,
  },
  isLoading: false,
  totalCount: 0,
  currentPage: 0,
  viewMode: 'list', // 'grid' (images only) or 'list' (cards with info)
};

// =============================================================================
// API SERVICE
// =============================================================================

/**
 * Fetch access token from I/O Runtime endpoint
 * Uses cached token if still valid, otherwise fetches a new one
 * @returns {Promise<string>} Access token
 */
async function getAccessToken() {
  // Check if we have a valid cached token (with 5 minute buffer)
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  if (TOKEN_CACHE.accessToken && TOKEN_CACHE.expiresAt > Date.now() + bufferMs) {
    // eslint-disable-next-line no-console
    console.log('[Asset Search] Using cached access token');
    return TOKEN_CACHE.accessToken;
  }

  // Fetch new token from I/O Runtime
  if (!CONFIG.runtimeEndpoint) {
    throw new Error('Runtime endpoint not configured');
  }

  // eslint-disable-next-line no-console
  console.log('[Asset Search] Fetching new access token from I/O Runtime...');

  const response = await fetch(CONFIG.runtimeEndpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Token request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.access_token) {
    throw new Error('No access token in response');
  }

  // Cache the token
  TOKEN_CACHE.accessToken = data.access_token;
  TOKEN_CACHE.expiresAt = data.expires_at || (Date.now() + (data.expires_in * 1000));

  // eslint-disable-next-line no-console
  console.log('[Asset Search] Access token obtained, expires at:', new Date(TOKEN_CACHE.expiresAt).toISOString());

  return TOKEN_CACHE.accessToken;
}

/**
 * Build request headers for DM API calls
 * @param {string} accessToken - The access token
 * @returns {Object} Headers object
 */
function getApiHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'X-Api-Key': CONFIG.clientId,
  };
}

/**
 * Build search query payload
 * @param {Object} options - Search options
 * @param {string} options.searchText - Text to search for
 * @param {string} options.color - Color filter
 * @param {string} options.category - Category filter
 * @param {number} options.limit - Results limit
 * @param {number} options.offset - Results offset
 * @returns {Object} Query payload for API
 */
function buildSearchQuery(options = {}) {
  const {
    searchText = '',
    limit = CONFIG.pageSize,
  } = options;

  // Base query structure - search across multiple fields
  const searchFields = [
    'metadata.repositoryMetadata.repo:name',
    'metadata.assetMetadata.dc:title',
    'metadata.assetMetadata.autogen:title',
    'metadata.assetMetadata.autogen:description',
    'metadata.assetMetadata.autogen:subject',
  ];

  const query = {
    query: [
      {
        match: {
          text: searchText || ' ',
          fields: searchFields,
        },
      },
    ],
    limit,
  };

  // Add filter for approved assets only
  // TODO: Add when API supports combining match + term queries
  // query.query.push({
  //   term: {
  //     'metadata.assetMetadata.dam:assetStatus': ['approved'],
  //   },
  // });

  return query;
}

/**
 * Search assets via DM API
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results
 */
async function searchAssets(options = {}) {
  // Get access token (cached or fresh)
  const accessToken = await getAccessToken();

  // Remove trailing slash from deliveryUrl if present
  const baseUrl = CONFIG.deliveryUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/adobe/assets/search`;
  const query = buildSearchQuery(options);

  // eslint-disable-next-line no-console
  console.log('[Asset Search] API Request:', url);
  // eslint-disable-next-line no-console
  console.log('[Asset Search] Query:', JSON.stringify(query, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: getApiHeaders(accessToken),
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  // eslint-disable-next-line no-console
  console.log('[Asset Search] Response:', data);

  return data;
}

/**
 * Build thumbnail URL for an asset using the public getAsset endpoint
 * @param {string} assetId - Asset URN
 * @returns {string} Thumbnail URL
 */
function buildThumbnailUrl(assetId) {
  // Remove trailing slash from deliveryUrl if present
  const baseUrl = CONFIG.deliveryUrl.replace(/\/+$/, '');
  // Use the public getAsset endpoint: /adobe/assets/{assetId}
  return `${baseUrl}/adobe/assets/${assetId}`;
}

// =============================================================================
// DATA UTILITIES
// =============================================================================

/**
 * Format file size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return 'N/A';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Get file extension from MIME type
 * @param {string} mimeType - MIME type (e.g., 'image/png')
 * @returns {string} Extension label
 */
function getFormatLabel(mimeType) {
  if (!mimeType) return 'Unknown';
  const ext = mimeType.split('/')[1];
  return ext ? ext.toUpperCase() : mimeType;
}

/**
 * Format dimensions for display
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} Formatted dimensions
 */
function formatDimensions(width, height) {
  if (!width || !height) return 'N/A';
  return `${width} × ${height}`;
}

/**
 * Parse asset from API response
 * @param {Object} result - Raw API result
 * @returns {Object} Normalized asset object
 */
function parseAsset(result) {
  const { assetId, repositoryMetadata = {}, assetMetadata = {} } = result;

  // Extract machine keyword values only
  const machineKeywordsRaw = assetMetadata['xcm:machineKeywords'] || [];
  const machineKeywords = machineKeywordsRaw.map((kw) => kw.value).filter(Boolean);

  return {
    id: assetId,
    filename: repositoryMetadata['repo:name'] || 'Untitled',
    title: assetMetadata['autogen:title'] || repositoryMetadata['repo:name'] || 'Untitled',
    description: assetMetadata['autogen:description'] || '',
    mimeType: repositoryMetadata['dc:format'] || '',
    size: repositoryMetadata['repo:size'] || 0,
    width: assetMetadata['tiff:ImageWidth'] || 0,
    height: assetMetadata['tiff:ImageLength'] || 0,
    status: assetMetadata['dam:assetStatus'] || 'unknown',
    tags: assetMetadata['autogen:subject'] || [],
    colors: assetMetadata['xcm:colorDistribution'] || [],
    machineKeywords,
    createdDate: repositoryMetadata['repo:createDate'],
    modifiedDate: repositoryMetadata['repo:modifyDate'],
    // URLs - use public getAsset endpoint
    thumbnailUrl: buildThumbnailUrl(assetId),
  };
}

// =============================================================================
// CART MANAGEMENT
// =============================================================================

const CART_STORAGE_KEY = 'asset-search-cart';

/**
 * Load cart from localStorage
 */
function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    STATE.cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    STATE.cart = [];
  }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(STATE.cart));
  } catch (e) {
    // Storage might be full or disabled
  }
}

/**
 * Add asset to cart
 * @param {Object} asset - Asset to add
 */
function addToCart(asset) {
  if (!STATE.cart.find((item) => item.id === asset.id)) {
    STATE.cart.push(asset);
    saveCart();
    renderCartUI(); // eslint-disable-line no-use-before-define
    updateCardCartButtons(); // eslint-disable-line no-use-before-define
  }
}

/**
 * Remove asset from cart
 * @param {string} assetId - Asset ID to remove
 */
function removeFromCart(assetId) {
  STATE.cart = STATE.cart.filter((item) => item.id !== assetId);
  saveCart();
  renderCartUI(); // eslint-disable-line no-use-before-define
  updateCardCartButtons(); // eslint-disable-line no-use-before-define
}

/**
 * Check if asset is in cart
 * @param {string} assetId - Asset ID
 * @returns {boolean}
 */
function isInCart(assetId) {
  return STATE.cart.some((item) => item.id === assetId);
}

/**
 * Clear entire cart
 */
// eslint-disable-next-line no-unused-vars
function clearCart() {
  STATE.cart = [];
  saveCart();
  renderCartUI(); // eslint-disable-line no-use-before-define
  updateCardCartButtons(); // eslint-disable-line no-use-before-define
}

// =============================================================================
// UI COMPONENTS
// =============================================================================

/**
 * Create view toggle component (Grid/List switch)
 * @returns {HTMLElement}
 */
function createViewToggle() {
  const container = document.createElement('div');
  container.className = 'asset-search-view-toggle';

  // Grid view button (images only)
  const gridBtn = document.createElement('button');
  gridBtn.className = 'view-toggle-btn';
  gridBtn.setAttribute('aria-label', 'Grid view');
  gridBtn.setAttribute('title', 'Grid view (images only)');
  gridBtn.dataset.view = 'grid';
  gridBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z"/>
    </svg>
  `;

  // List view button (cards with info) - default active
  const listBtn = document.createElement('button');
  listBtn.className = 'view-toggle-btn active';
  listBtn.setAttribute('aria-label', 'List view');
  listBtn.setAttribute('title', 'List view (with details)');
  listBtn.dataset.view = 'list';
  listBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h4v4H4V4zm6 0h10v4H10V4zM4 10h4v4H4v-4zm6 0h10v4H10v-4zM4 16h4v4H4v-4zm6 0h10v4H10v-4z"/>
    </svg>
  `;

  // Toggle view mode
  const toggleView = (view) => {
    STATE.viewMode = view;
    
    // Update button states
    gridBtn.classList.toggle('active', view === 'grid');
    listBtn.classList.toggle('active', view === 'list');
    
    // Update grid class
    const grid = document.querySelector('.asset-search-grid');
    if (grid) {
      // Grid view = images only
      // List view = current default (cards with info)
      grid.classList.toggle('grid-mode', view === 'grid');
      
      // Update all card classes
      const cards = grid.querySelectorAll('.asset-search-card');
      cards.forEach((card) => {
        card.classList.toggle('image-only', view === 'grid');
      });
    }
  };

  gridBtn.addEventListener('click', () => toggleView('grid'));
  listBtn.addEventListener('click', () => toggleView('list'));

  container.appendChild(gridBtn);
  container.appendChild(listBtn);

  return container;
}

/**
 * Create search bar component
 * @returns {HTMLElement}
 */
function createSearchBar() {
  const row = document.createElement('div');
  row.className = 'asset-search-search-row';

  const container = document.createElement('div');
  container.className = 'asset-search-search';

  container.innerHTML = `
    <span class="asset-search-search-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
      </svg>
    </span>
    <input
      type="text"
      class="asset-search-search-input"
      placeholder="Search assets..."
      aria-label="Search assets"
    />
    <button type="button" class="asset-search-search-button">Search</button>
  `;

  const input = container.querySelector('.asset-search-search-input');
  const button = container.querySelector('.asset-search-search-button');

  const handleSearch = () => {
    STATE.searchQuery = input.value.trim();
    STATE.currentPage = 0;
    executeSearch(); // eslint-disable-line no-use-before-define
  };

  button.addEventListener('click', handleSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Assemble search row with view toggle
  row.appendChild(container);
  row.appendChild(createViewToggle());

  return row;
}

/**
 * Create category pills component
 * @param {Array} categories - Category configurations
 * @returns {HTMLElement}
 */
function createCategoryPills(categories) {
  const container = document.createElement('div');
  container.className = 'asset-search-pills';

  categories.forEach((cat) => {
    const pill = document.createElement('button');
    pill.className = 'asset-search-pill';
    pill.textContent = cat.label;
    pill.dataset.value = cat.value || cat.label;

    pill.addEventListener('click', () => {
      const wasActive = pill.classList.contains('active');

      // Deactivate all pills
      container.querySelectorAll('.asset-search-pill').forEach((p) => {
        p.classList.remove('active');
      });

      if (!wasActive) {
        pill.classList.add('active');
        STATE.activeFilters.category = pill.dataset.value;
      } else {
        STATE.activeFilters.category = null;
      }

      STATE.currentPage = 0;
      executeSearch(); // eslint-disable-line no-use-before-define
    });

    container.appendChild(pill);
  });

  return container;
}

/**
 * Create asset card component
 * @param {Object} asset - Parsed asset object
 * @returns {HTMLElement}
 */
function createAssetCard(asset) {
  const card = document.createElement('div');
  card.className = 'asset-search-card';
  // Apply image-only class if in grid mode (images only)
  if (STATE.viewMode === 'grid') {
    card.classList.add('image-only');
  }
  card.dataset.assetId = asset.id;

  // Thumbnail
  const thumbnail = document.createElement('div');
  thumbnail.className = 'asset-card-thumbnail';

  const img = document.createElement('img');
  img.alt = asset.title;
  img.loading = 'lazy';

  // Retry configuration
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [500, 1500, 3000]; // Exponential backoff: 500ms, 1.5s, 3s
  let retryCount = 0;
  let imageLoaded = false;

  // Placeholder SVG for failed images
  const placeholderSvg = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23333" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666" font-size="12">No Preview</text></svg>';

  // Function to attempt loading the image
  const attemptLoad = (url) => {
    // Add cache-busting parameter on retries to avoid cached failures
    const loadUrl = retryCount > 0 ? `${url}${url.includes('?') ? '&' : '?'}retry=${retryCount}` : url;
    img.src = loadUrl;
  };

  // Enhanced error handling with retry mechanism
  img.onerror = () => {
    // If already loaded successfully via onload, ignore the error
    if (imageLoaded) return;

    retryCount += 1;

    const errorInfo = {
      assetId: asset.id,
      filename: asset.filename,
      attemptedUrl: asset.thumbnailUrl,
      attempt: retryCount,
      maxRetries: MAX_RETRIES,
    };

    if (retryCount <= MAX_RETRIES) {
      // eslint-disable-next-line no-console
      console.warn(`[Asset Search] Image load failed, retrying (${retryCount}/${MAX_RETRIES}): ${JSON.stringify(errorInfo, null, 2)}`);

      // Schedule retry with exponential backoff
      const delay = RETRY_DELAYS[retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      setTimeout(() => {
        if (!imageLoaded) {
          attemptLoad(asset.thumbnailUrl);
        }
      }, delay);
    } else {
      // All retries exhausted, show placeholder
      // eslint-disable-next-line no-console
      console.error(`[Asset Search] Image load failed after ${MAX_RETRIES} retries: ${JSON.stringify(errorInfo, null, 2)}`);
      img.src = placeholderSvg;
    }
  };

  // Log successful loads
  img.onload = () => {
    // Check if this is the placeholder loading (ignore)
    if (img.src.startsWith('data:image/svg+xml')) return;

    imageLoaded = true;
    const successInfo = {
      assetId: asset.id,
      filename: asset.filename,
      url: asset.thumbnailUrl,
      attempts: retryCount + 1,
    };
    // eslint-disable-next-line no-console
    console.log(`[Asset Search] Image loaded successfully${retryCount > 0 ? ` after ${retryCount} retries` : ''}: ${JSON.stringify(successInfo, null, 2)}`);
  };

  // Start first load attempt
  attemptLoad(asset.thumbnailUrl);

  thumbnail.appendChild(img);

  // Add hover title overlay for grid view (image-only mode)
  const hoverTitle = document.createElement('div');
  hoverTitle.className = 'asset-card-hover-title';
  hoverTitle.textContent = asset.title || asset.name || 'Untitled';
  thumbnail.appendChild(hoverTitle);

  // Status badge (if not approved, show indicator)
  if (asset.status && asset.status !== 'approved') {
    const statusBadge = document.createElement('span');
    statusBadge.className = 'asset-card-status';
    statusBadge.textContent = asset.status;
    thumbnail.appendChild(statusBadge);
  }

  // Info section
  const info = document.createElement('div');
  info.className = 'asset-card-info';

  // Format badge and status
  const topRow = document.createElement('div');
  topRow.className = 'asset-card-top-row';

  const format = document.createElement('span');
  format.className = `asset-card-format format-${getFormatLabel(asset.mimeType).toLowerCase()}`;
  format.textContent = getFormatLabel(asset.mimeType);
  topRow.appendChild(format);

  if (asset.status) {
    const statusBadge = document.createElement('span');
    statusBadge.className = `asset-card-status-badge status-${asset.status.toLowerCase()}`;
    statusBadge.textContent = asset.status;
    topRow.appendChild(statusBadge);
  }

  // AI Title (first)
  const title = document.createElement('h4');
  title.className = 'asset-card-title';
  title.textContent = asset.title;
  title.title = asset.title;
  info.appendChild(title);

  // Format badge + Status badge
  info.appendChild(topRow);

  // Filename and size
  const meta = document.createElement('div');
  meta.className = 'asset-card-meta';
  meta.innerHTML = `
    <span class="asset-card-filename">${asset.filename}</span>
    <span class="asset-card-size">${formatFileSize(asset.size)} • ${formatDimensions(asset.width, asset.height)}</span>
  `;
  info.appendChild(meta);

  // AI Description
  if (asset.description) {
    const description = document.createElement('p');
    description.className = 'asset-card-description';
    description.textContent = asset.description;
    info.appendChild(description);
  }

  // Color Distribution (swatches with names on hover)
  if (asset.colors && asset.colors.length > 0) {
    const colorsContainer = document.createElement('div');
    colorsContainer.className = 'asset-card-colors';

    asset.colors.forEach((color) => {
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      const [r, g, b] = color.rgb || [128, 128, 128];
      swatch.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      swatch.title = color.name || 'Unknown';
      swatch.setAttribute('aria-label', color.name || 'Unknown');
      colorsContainer.appendChild(swatch);
    });

    info.appendChild(colorsContainer);
  }

  // Tags (autogen:subject)
  if (asset.tags && asset.tags.length > 0) {
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'asset-card-tags';

    asset.tags.forEach((tag) => {
      const tagEl = document.createElement('span');
      tagEl.className = 'asset-tag';
      tagEl.textContent = tag;
      tagsContainer.appendChild(tagEl);
    });

    info.appendChild(tagsContainer);
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'asset-card-actions';

  // Download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'asset-action-btn';
  downloadBtn.setAttribute('aria-label', 'Download');
  downloadBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
    </svg>
  `;
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // TODO: Implement proper download with rendition selection
    window.open(asset.thumbnailUrl, '_blank');
  });

  // Cart button
  const cartBtn = document.createElement('button');
  cartBtn.className = `asset-action-btn cart-btn ${isInCart(asset.id) ? 'in-cart' : ''}`;
  cartBtn.setAttribute('aria-label', isInCart(asset.id) ? 'Remove from cart' : 'Add to cart');
  cartBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  `;
  cartBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isInCart(asset.id)) {
      removeFromCart(asset.id);
    } else {
      addToCart(asset);
    }
  });

  actions.appendChild(downloadBtn);
  actions.appendChild(cartBtn);

  card.appendChild(thumbnail);
  card.appendChild(info);
  card.appendChild(actions);

  // Add click-to-cart functionality for grid view (image-only mode)
  card.addEventListener('click', (e) => {
    // Only handle clicks in grid mode (image-only)
    if (STATE.viewMode === 'grid') {
      // Don't trigger if clicking on action buttons
      if (e.target.closest('.asset-card-actions')) {
        return;
      }
      
      // Toggle cart state
      if (isInCart(asset.id)) {
        removeFromCart(asset.id);
      } else {
        addToCart(asset);
      }
    }
  });

  return card;
}

/**
 * Create sidebar component
 * @returns {HTMLElement}
 */
function createSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.className = 'asset-search-sidebar';

  sidebar.innerHTML = `
    <div class="sidebar-stats">
      <div class="stat-item">
        <span class="stat-value" id="displayed-count">0</span>
        <span class="stat-label">Displayed</span>
      </div>
      <div class="stat-item">
        <span class="stat-value" id="total-count">0</span>
        <span class="stat-label">Total</span>
      </div>
    </div>
    <button class="sidebar-reset-btn">Reset Filters</button>
  `;

  const resetBtn = sidebar.querySelector('.sidebar-reset-btn');
  resetBtn.addEventListener('click', () => {
    // Reset state
    STATE.searchQuery = '';
    STATE.activeFilters = { color: null, category: null };
    STATE.currentPage = 0;

    // Reset UI
    const searchInput = document.querySelector('.asset-search-search-input');
    if (searchInput) searchInput.value = '';

    document.querySelectorAll('.asset-search-pill.active').forEach((p) => {
      p.classList.remove('active');
    });

    executeSearch(); // eslint-disable-line no-use-before-define
  });

  return sidebar;
}

/**
 * Create cart drawer component
 * @returns {HTMLElement}
 */
function createCartDrawer() {
  const drawer = document.createElement('div');
  drawer.className = 'asset-search-cart-drawer';
  drawer.id = 'cart-drawer';

  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3>Cart</h3>
      <button class="cart-close-btn" aria-label="Close cart">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    <div class="cart-drawer-content" id="cart-items"></div>
    <div class="cart-drawer-footer">
      <span id="cart-count">0 items</span>
      <button class="cart-download-btn">Download All</button>
    </div>
  `;

  drawer.querySelector('.cart-close-btn').addEventListener('click', () => {
    drawer.classList.remove('open');
  });

  drawer.querySelector('.cart-download-btn').addEventListener('click', () => {
    // Download all items in cart
    STATE.cart.forEach((asset) => {
      if (asset.thumbnailUrl) {
        window.open(asset.thumbnailUrl, '_blank');
      }
    });
  });

  return drawer;
}

/**
 * Create cart toggle button
 * @param {HTMLElement} drawer - Cart drawer element
 * @returns {HTMLElement}
 */
function createCartToggle(drawer) {
  const toggle = document.createElement('button');
  toggle.className = 'asset-search-cart-toggle';
  toggle.setAttribute('aria-label', 'Open cart');

  // Create SVG element properly to avoid innerHTML parsing issues
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('fill', 'currentColor');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z');
  svg.appendChild(path);

  const badge = document.createElement('span');
  badge.className = 'cart-badge';
  badge.id = 'cart-badge';
  badge.textContent = '0';

  toggle.appendChild(svg);
  toggle.appendChild(badge);

  toggle.addEventListener('click', () => {
    drawer.classList.toggle('open');
  });

  return toggle;
}

/**
 * Create loading indicator
 * @returns {HTMLElement}
 */
function createLoader() {
  const loader = document.createElement('div');
  loader.className = 'asset-search-loader';
  loader.style.display = 'none';

  loader.innerHTML = `
    <div class="loader-spinner"></div>
    <span>Loading assets...</span>
  `;

  return loader;
}

// =============================================================================
// UI UPDATES
// =============================================================================

/**
 * Update cart UI elements
 */
function renderCartUI() {
  const cartItems = document.getElementById('cart-items');
  const cartCount = document.getElementById('cart-count');
  const cartBadge = document.getElementById('cart-badge');

  if (cartItems) {
    cartItems.innerHTML = '';

    if (STATE.cart.length === 0) {
      cartItems.innerHTML = '<p style="color: var(--text-color-muted); text-align: center; padding: 24px;">Cart is empty</p>';
    } else {
      STATE.cart.forEach((asset) => {
        const item = document.createElement('div');
        item.className = 'cart-item';

        const img = document.createElement('img');
        img.src = asset.thumbnailUrl;
        img.alt = asset.filename;

        const name = document.createElement('span');
        name.className = 'cart-item-name';
        name.textContent = asset.filename;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'cart-item-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.addEventListener('click', () => removeFromCart(asset.id));

        item.appendChild(img);
        item.appendChild(name);
        item.appendChild(removeBtn);
        cartItems.appendChild(item);
      });
    }
  }

  if (cartCount) {
    cartCount.textContent = `${STATE.cart.length} item${STATE.cart.length !== 1 ? 's' : ''}`;
  }

  if (cartBadge) {
    cartBadge.textContent = STATE.cart.length;
    cartBadge.style.display = STATE.cart.length > 0 ? 'flex' : 'none';
  }
}

/**
 * Update cart buttons on all visible cards
 */
function updateCardCartButtons() {
  document.querySelectorAll('.asset-search-card').forEach((card) => {
    const { assetId } = card.dataset;
    const cartBtn = card.querySelector('.cart-btn');
    const thumbnail = card.querySelector('.asset-card-thumbnail');
    
    const inCart = isInCart(assetId);
    
    // Update cart button
    if (cartBtn) {
      cartBtn.classList.toggle('in-cart', inCart);
      cartBtn.setAttribute('aria-label', inCart ? 'Remove from cart' : 'Add to cart');
    }
    
    // Update thumbnail for grid view (image-only mode)
    if (thumbnail) {
      thumbnail.classList.toggle('in-cart', inCart);
    }
  });
}

/**
 * Update stats display
 */
function updateStats() {
  const displayedEl = document.getElementById('displayed-count');
  const totalEl = document.getElementById('total-count');

  if (displayedEl) displayedEl.textContent = STATE.assets.length;
  if (totalEl) totalEl.textContent = STATE.totalCount;
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading
 */
function setLoading(show) {
  STATE.isLoading = show;
  const loader = document.querySelector('.asset-search-loader');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Render assets to grid
 * @param {Array} assets - Parsed assets array
 */
function renderAssets(assets) {
  const grid = document.querySelector('.asset-search-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (assets.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'asset-search-no-results';
    empty.innerHTML = `
      <h3 class="no-results-title">No assets found</h3>
      <p class="no-results-message">We couldn't find any assets matching your criteria. Try adjusting your search or filters.</p>
    `;
    grid.appendChild(empty);
    return;
  }

  assets.forEach((asset) => {
    const card = createAssetCard(asset);
    grid.appendChild(card);
  });
}

/**
 * Parse error message and return user-friendly version
 * @param {string} message - Raw error message
 * @returns {object} - Title and description for display
 */
function parseErrorMessage(message) {
  // Check for repository not found error
  if (message.includes('Repository not found') || message.includes('not_found')) {
    return {
      title: 'Repository Unavailable',
      description: 'The asset repository is currently unavailable. This may be due to maintenance or configuration issues. Please try again later or contact your administrator.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
    };
  }

  // Check for authentication errors
  if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
    return {
      title: 'Authentication Failed',
      description: 'Unable to authenticate with the asset repository. The access token may have expired or the credentials are invalid.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>`,
    };
  }

  // Check for network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return {
      title: 'Network Error',
      description: 'Unable to connect to the asset repository. Please check your internet connection and try again.',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>`,
    };
  }

  // Default error
  return {
    title: 'Unable to Load Assets',
    description: message,
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`,
  };
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const grid = document.querySelector('.asset-search-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const { title, description, icon } = parseErrorMessage(message);

  const error = document.createElement('div');
  error.className = 'asset-search-error';
  error.innerHTML = `
    <div class="error-icon">${icon}</div>
    <h3 class="error-title">${title}</h3>
    <p class="error-description">${description}</p>
  `;
  grid.appendChild(error);
}

// =============================================================================
// MAIN SEARCH EXECUTION
// =============================================================================

/**
 * Execute search with current state
 */
async function executeSearch() {
  if (STATE.isLoading) return;

  // Validate configuration
  if (!CONFIG.deliveryUrl || !CONFIG.runtimeEndpoint || !CONFIG.clientId) {
    showError('Block not configured. Please set Delivery URL, Runtime Endpoint, and Client ID in Universal Editor.');
    return;
  }

  setLoading(true);

  try {
    const response = await searchAssets({
      searchText: STATE.searchQuery,
      color: STATE.activeFilters.color,
      category: STATE.activeFilters.category,
      limit: CONFIG.pageSize,
      offset: STATE.currentPage * CONFIG.pageSize,
    });

    // Parse results
    const results = response?.hits?.results || [];
    STATE.assets = results.map(parseAsset);
    STATE.totalCount = response?.search_metadata?.totalCount?.total || results.length;

    // Render
    renderAssets(STATE.assets);
    updateStats();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Asset Search] Error:', error);
    showError(error.message);
  } finally {
    setLoading(false);
  }
}

// =============================================================================
// BLOCK INITIALIZATION
// =============================================================================

/**
 * Parse block configuration and categories from Universal Editor content
 *
 * Expected block structure from UE:
 * - Row 0: Delivery URL (single column with URL or link)
 * - Row 1: Bearer Key (single column with token)
 * - Row 2: Client ID (single column with client ID)
 * - Row 3: Page Size (optional, single column with number)
 * - Row 4+: Category pills (two columns: label | filterValue)
 *
 * @param {HTMLElement} block - Block element
 * @returns {Object} Parsed configuration and categories
 */
function parseBlockContent(block) {
  const rows = [...block.children];

  // Helper to extract text from a cell (handles links, text, etc.)
  const getCellText = (cell) => {
    if (!cell) return '';
    // Check for link first
    const link = cell.querySelector('a');
    if (link) return link.href || link.textContent?.trim() || '';
    return cell.textContent?.trim() || '';
  };

  // Configuration from first 4 rows (by position)
  const config = {
    deliveryUrl: getCellText(rows[0]?.children[0]),
    runtimeEndpoint: getCellText(rows[1]?.children[0]),
    clientId: getCellText(rows[2]?.children[0]),
    pageSize: parseInt(getCellText(rows[3]?.children[0]), 10) || 20,
  };

  // Category pills from remaining rows (must have 2 columns: label | value)
  const categories = [];
  for (let i = 4; i < rows.length; i += 1) {
    const cols = [...(rows[i]?.children || [])];
    if (cols.length >= 2) {
      const label = getCellText(cols[0]);
      const value = getCellText(cols[1]) || label;
      if (label) {
        categories.push({ label, value });
      }
    }
  }

  return { config, categories };
}

/**
 * Main block decorator
 * @param {HTMLElement} block - Block element
 */
export default async function decorate(block) {
  // Parse configuration and categories from block content
  const { config, categories } = parseBlockContent(block);

  // Apply configuration
  Object.assign(CONFIG, config);

  // Debug logging
  // eslint-disable-next-line no-console
  console.log('[Asset Search] Config:', {
    deliveryUrl: CONFIG.deliveryUrl ? '✓ Set' : '✗ Missing',
    runtimeEndpoint: CONFIG.runtimeEndpoint ? '✓ Set' : '✗ Missing',
    clientId: CONFIG.clientId ? '✓ Set' : '✗ Missing',
    pageSize: CONFIG.pageSize,
  });
  // eslint-disable-next-line no-console
  console.log('[Asset Search] Categories:', categories);

  // Clear block content
  block.innerHTML = '';

  // Build UI structure
  const container = document.createElement('div');
  container.className = 'asset-search-container';

  // Header (pills + search)
  const header = document.createElement('div');
  header.className = 'asset-search-header';

  if (categories.length > 0) {
    header.appendChild(createCategoryPills(categories));
  }
  header.appendChild(createSearchBar());

  // Main area (grid + sidebar)
  const main = document.createElement('div');
  main.className = 'asset-search-main';

  const gridWrapper = document.createElement('div');
  gridWrapper.className = 'asset-search-grid-wrapper';

  const grid = document.createElement('div');
  grid.className = 'asset-search-grid';

  gridWrapper.appendChild(grid);
  gridWrapper.appendChild(createLoader());

  main.appendChild(gridWrapper);
  main.appendChild(createSidebar());

  // Assemble
  container.appendChild(header);
  container.appendChild(main);

  // Cart
  const cartDrawer = createCartDrawer();
  const cartToggle = createCartToggle(cartDrawer);
  container.appendChild(cartDrawer);
  container.appendChild(cartToggle);

  block.appendChild(container);

  // Initialize cart
  loadCart();
  renderCartUI();

  // Execute initial search (show all approved assets)
  await executeSearch();
}
