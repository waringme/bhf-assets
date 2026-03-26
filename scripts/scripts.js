import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  readBlockConfig,
} from './aem.js';

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates images in default content with size classes
 * @param {Element} main The main element
 */
export function decorateImages(main) {
  // Find all paragraphs containing pictures
  main.querySelectorAll('p').forEach((p) => {
    const picture = p.querySelector('picture');
    if (picture) {
      // Always add 'image' class
      p.classList.add('image');
      
      // Check for imageSize in various data attribute patterns
      // Universal Editor stores component model fields in data attributes
      let imageSize = p.dataset.imageSize 
        || picture.dataset.imageSize
        || p.getAttribute('data-image-size')
        || picture.getAttribute('data-image-size');
      
      // Check for camelCase version (data-imageSize)
      if (!imageSize) {
        imageSize = p.dataset.imageSize || picture.dataset.imageSize;
      }
      
      // Check Universal Editor data attributes
      // Components have data-aue-prop-{fieldName} or data-richtext-prop-{fieldName}
      if (!imageSize) {
        imageSize = p.getAttribute('data-aue-prop-imageSize') 
          || p.getAttribute('data-richtext-prop-imageSize')
          || picture.getAttribute('data-aue-prop-imageSize')
          || picture.getAttribute('data-richtext-prop-imageSize');
      }
      
      // Check for metadata in parent wrapper (Universal Editor might store it there)
      if (!imageSize) {
        const wrapper = p.closest('.default-content-wrapper');
        if (wrapper) {
          imageSize = wrapper.dataset.imageSize || wrapper.getAttribute('data-image-size');
        }
      }
      
      // Debug: log if we find an image but no size (only in development)
      if (!imageSize && window.location.hostname === 'localhost') {
        console.log('Image found but no imageSize metadata:', {
          paragraph: p,
          picture: picture,
          pAttrs: [...p.attributes].map(a => `${a.name}="${a.value}"`),
          pictureAttrs: [...picture.attributes].map(a => `${a.name}="${a.value}"`),
        });
      }
      
      // Add size class if specified
      if (imageSize && imageSize.trim()) {
        p.classList.add(imageSize.trim());
      }
    }
  });
}

/**
 * Decorates text components with alignment classes
 * @param {Element} main The main element
 */
export function decorateText(main) {
  // Find all text components (divs with data-aue-resource that are text components)
  main.querySelectorAll('[data-aue-resource]').forEach((element) => {
    // Check if this is a text component
    const resourceType = element.getAttribute('data-aue-resource');
    if (!resourceType || !resourceType.includes('/text')) return;
    
    // Check for textAlign in various data attribute patterns
    let textAlign = element.dataset.textAlign
      || element.getAttribute('data-text-align')
      || element.getAttribute('data-aue-prop-textAlign')
      || element.getAttribute('data-aue-prop-text-align');
    
    // Check parent wrapper for textAlign
    if (!textAlign) {
      const wrapper = element.closest('.default-content-wrapper');
      if (wrapper) {
        textAlign = wrapper.dataset.textAlign || wrapper.getAttribute('data-text-align');
      }
    }
    
    // Apply alignment class if specified
    if (textAlign && textAlign.trim()) {
      element.classList.add(`text-align-${textAlign.trim()}`);
    }
  });
  
  // Also check for text alignment in paragraphs within default content wrappers
  main.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
    const textAlign = wrapper.dataset.textAlign 
      || wrapper.getAttribute('data-text-align')
      || wrapper.getAttribute('data-aue-prop-textAlign')
      || wrapper.getAttribute('data-aue-prop-text-align');
    
    if (textAlign && textAlign.trim()) {
      wrapper.classList.add(`text-align-${textAlign.trim()}`);
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateImages(main);
  decorateText(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  loadSidebarNav(doc);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads the sidebar navigation block
 * @param {Document} doc The document
 */
async function loadSidebarNav(doc) {
  const { buildBlock, decorateBlock, loadBlock } = await import('./aem.js');
  
  // Check if sidebar-nav block already exists
  if (doc.querySelector('.sidebar-nav-wrapper')) {
    return;
  }
  
  // Create sidebar wrapper
  const sidebarWrapper = document.createElement('div');
  sidebarWrapper.className = 'sidebar-nav-wrapper';
  
  // Build the sidebar-nav block with /sidebar-nav fragment
  const sidebarBlock = buildBlock('sidebar-nav', [['/sidebar-nav']]);
  
  // Insert at the beginning of body
  doc.body.prepend(sidebarWrapper);
  sidebarWrapper.appendChild(sidebarBlock);
  
  // Decorate and load the block
  decorateBlock(sidebarBlock);
  await loadBlock(sidebarBlock);
}


/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
