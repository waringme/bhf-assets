import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  // Check if block contains a fragment path (like '/sidebar-nav')
  const blockText = block.textContent.trim();
  
  // If block contains a path, load the fragment
  if (blockText && blockText.startsWith('/')) {
    const fragmentContent = await loadFragment(blockText);
    if (fragmentContent) {
      // Find the text block in the fragment - it could be in a section
      // Look for the actual list structure (ul/ol) in the fragment first
      const listInFragment = fragmentContent.querySelector('ul, ol');
      if (listInFragment) {
        // Clone the list and add it to the block
        block.innerHTML = '';
        block.appendChild(listInFragment.cloneNode(true));
      } else {
        // Try to find text block content - look in sections
        const sections = fragmentContent.querySelectorAll('.section');
        let foundContent = false;
        
        for (const section of sections) {
          // Look for text block or list in this section
          const textBlock = section.querySelector('.text, [class*="text"], p, ul, ol');
          if (textBlock) {
            // If it's a list, use it directly
            if (textBlock.tagName === 'UL' || textBlock.tagName === 'OL') {
              block.innerHTML = '';
              block.appendChild(textBlock.cloneNode(true));
            } else {
              // Otherwise use the text block's innerHTML
              block.innerHTML = textBlock.innerHTML;
            }
            foundContent = true;
            break;
          }
        }
        
        // If still no content found, use the first section's content
        if (!foundContent && sections.length > 0) {
          block.innerHTML = sections[0].innerHTML;
        }
      }
    }
  }
  
  // Clear block and add sidebar class directly to block
  block.className = 'sidebar-nav';
  
  // Create header section with logo
  const header = document.createElement('div');
  header.className = 'sidebar-nav-header';
  
  const title = document.createElement('div');
  title.className = 'sidebar-nav-title sidebar-nav-title--logo';
  const logo = document.createElement('img');
  logo.src = `${window.hlx?.codeBasePath || ''}/icons/pl-logo.png`;
  logo.alt = 'Premier League';
  title.appendChild(logo);
  
  header.appendChild(title);
  
  // Create navigation items section
  const navItems = document.createElement('div');
  navItems.className = 'sidebar-nav-items';
  
  // Icon mapping for common items
  const iconMap = {
    'brand portal': 'rocket',
    'sky brand portal': 'circle',
    'now brand portal': 'circle',
  };
  
  // Function to get icon type based on text
  function getIconType(text) {
    const textLower = text.toLowerCase();
    return iconMap[textLower] || 'circle';
  }
  
  // Function to create icon SVG
  function createIcon(iconType) {
    const icon = document.createElement('span');
    icon.className = 'sidebar-nav-item-icon';
    
    if (iconType === 'rocket') {
      icon.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2L12 8H8L10 2Z" fill="currentColor"/>
          <path d="M6 8H14L12 18H8L6 8Z" fill="currentColor"/>
          <path d="M8 8L10 12L12 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      `;
    } else {
      icon.innerHTML = `
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="6" fill="currentColor" opacity="0.3"/>
          <circle cx="10" cy="10" r="3" fill="currentColor"/>
        </svg>
      `;
    }
    
    return icon;
  }
  
  // Function to create chevron icon
  function createChevron() {
    const chevron = document.createElement('span');
    chevron.className = 'sidebar-nav-chevron';
    chevron.innerHTML = `
      <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    return chevron;
  }
  
  // Function to check if current page matches link
  function isActiveLink(link) {
    if (!link) return false;
    const currentPath = window.location.pathname;
    try {
      const linkPath = new URL(link.href, window.location.origin).pathname;
      return currentPath === linkPath || currentPath.startsWith(linkPath + '/');
    } catch (e) {
      return false;
    }
  }
  
  // Function to extract text from list item (handling nested structures)
  function getListItemText(listItem) {
    // Clone the item to avoid modifying original
    const clone = listItem.cloneNode(true);
    // Remove nested lists
    clone.querySelectorAll('ul, ol').forEach(list => list.remove());
    return clone.textContent.trim();
  }
  
  // Function to process list items recursively
  function processListItem(listItem, isNested = false) {
    const text = getListItemText(listItem);
    const link = listItem.querySelector('a');
    const nestedList = listItem.querySelector(':scope > ul, :scope > ol');
    
    // Skip empty items
    if (!text && !nestedList) return null;
    
    // Handle parent items with children
    if (nestedList) {
      // Create section wrapper for parent item
      const section = document.createElement('div');
      section.className = 'sidebar-nav-section';
      
      // Create header for parent item
      const itemHeader = document.createElement('div');
      itemHeader.className = 'sidebar-nav-item-header';
      
      const itemText = document.createElement('span');
      itemText.className = 'sidebar-nav-item-text';
      itemText.textContent = text;
      
      const chevron = createChevron();
      
      itemHeader.appendChild(itemText);
      itemHeader.appendChild(chevron);
      
      // Add click handler for expand/collapse with accordion behavior
      itemHeader.addEventListener('click', () => {
        const isCurrentlyExpanded = section.classList.contains('expanded');
        
        // Collapse all other sections (accordion behavior)
        const allSections = navItems.querySelectorAll('.sidebar-nav-section');
        allSections.forEach(otherSection => {
          if (otherSection !== section) {
            otherSection.classList.remove('expanded');
          }
        });
        
        // Toggle current section
        if (!isCurrentlyExpanded) {
          section.classList.add('expanded');
        } else {
          section.classList.remove('expanded');
        }
      });
      
      // Create subitems container
      const subItems = document.createElement('div');
      subItems.className = 'sidebar-nav-subitems';
      
      // Process nested list items
      const nestedItems = nestedList.querySelectorAll(':scope > li');
      let hasActiveChild = false;
      nestedItems.forEach((nestedItem) => {
        const subItem = processListItem(nestedItem, true);
        if (subItem) {
          subItems.appendChild(subItem);
          // Check if this subitem is active
          if (subItem.classList.contains('active')) {
            hasActiveChild = true;
          }
        }
      });
      
      section.appendChild(itemHeader);
      section.appendChild(subItems);
      
      // If any child is active, expand the section
      if (hasActiveChild) {
        section.classList.add('expanded');
      }
      
      return section;
    } else {
      // Regular navigation item (no children)
      const navItem = document.createElement(link ? 'a' : 'div');
      navItem.className = isNested ? 'sidebar-nav-subitem' : 'sidebar-nav-item';
      
      if (link) {
        navItem.href = link.href;
        navItem.textContent = link.textContent.trim();
      } else {
        navItem.textContent = text;
      }
      
      // Check if active
      if (isActiveLink(link)) {
        navItem.classList.add('active');
      }
      
      const itemText = document.createElement('span');
      itemText.className = 'sidebar-nav-item-text';
      itemText.textContent = navItem.textContent;
      
      navItem.textContent = '';
      navItem.appendChild(itemText);
      
      return navItem;
    }
  }
  
  // IMPORTANT: Find the list BEFORE clearing the block content
  // Find the main list (ul or ol) anywhere in the block
  // It could be directly in the block, or nested in divs/sections
  const mainList = block.querySelector('ul, ol');
  let listItemsToProcess = [];
  
  if (mainList) {
    // Get all top-level list items
    listItemsToProcess = Array.from(mainList.querySelectorAll(':scope > li'));
    
    // If no direct children, try all li elements (might be nested structure)
    if (listItemsToProcess.length === 0) {
      const allListItems = mainList.querySelectorAll('li');
      listItemsToProcess = Array.from(allListItems).filter((listItem) => {
        // Only process top-level items (not nested ones)
        return listItem.parentElement === mainList || !listItem.parentElement.closest('li');
      });
    }
  }
  
  // Create footer with user profile
  const footer = document.createElement('div');
  footer.className = 'sidebar-nav-footer';
  
  const userProfile = document.createElement('div');
  userProfile.className = 'sidebar-nav-user';
  
  const userIcon = document.createElement('div');
  userIcon.className = 'sidebar-nav-user-icon';
  userIcon.innerHTML = `
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor"/>
      <path d="M10 12C5.58172 12 2 14.2386 2 17V20H18V17C18 14.2386 14.4183 12 10 12Z" fill="currentColor"/>
    </svg>
  `;
  
  const userName = document.createElement('span');
  userName.className = 'sidebar-nav-user-name';
  userName.textContent = 'Tano Polizzi';
  
  userProfile.appendChild(userIcon);
  userProfile.appendChild(userName);
  footer.appendChild(userProfile);
  
  // Now process the list items we found
  if (listItemsToProcess.length > 0) {
    listItemsToProcess.forEach((listItem) => {
      const navItem = processListItem(listItem, false);
      if (navItem) {
        navItems.appendChild(navItem);
      }
    });
  } else {
    // Fallback: process as flat structure (original behavior)
    // But we need to do this BEFORE clearing the block
    const rows = [...block.querySelectorAll(':scope > div')];
    if (rows.length > 0) {
      rows.forEach((row) => {
        const text = row.textContent.trim();
        if (!text) return;
        
        const link = row.querySelector('a');
        const navItem = document.createElement(link ? 'a' : 'div');
        navItem.className = 'sidebar-nav-item';
        
        if (link) {
          navItem.href = link.href;
          navItem.textContent = link.textContent.trim();
        } else {
          navItem.textContent = text;
        }
        
        if (isActiveLink(link)) {
          navItem.classList.add('active');
        }
        
        const itemText = document.createElement('span');
        itemText.className = 'sidebar-nav-item-text';
        itemText.textContent = navItem.textContent;
        
        navItem.textContent = '';
        navItem.appendChild(itemText);
        
        navItems.appendChild(navItem);
      });
    }
  }
  
  // Debug: Log if no items were created
  if (navItems.children.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('[sidebar-nav] No navigation items created.');
    // eslint-disable-next-line no-console
    console.warn('[sidebar-nav] Block HTML before clearing:', block.innerHTML.substring(0, 500));
    // eslint-disable-next-line no-console
    console.warn('[sidebar-nav] Found list:', mainList ? 'Yes' : 'No');
    // eslint-disable-next-line no-console
    console.warn('[sidebar-nav] List items to process:', listItemsToProcess.length);
  }
  
  // Assemble sidebar - NOW we can clear the block
  block.textContent = '';
  block.appendChild(header);
  block.appendChild(navItems);
  block.appendChild(footer);
}
