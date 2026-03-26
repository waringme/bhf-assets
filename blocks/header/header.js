import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Loads and decorates the header with Sky gradient bar and two-row layout
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';

  // Create top row container
  const topRow = document.createElement('div');
  topRow.className = 'nav-top-row';

  // Tools section (Clubs button)
  const navTools = document.createElement('div');
  navTools.className = 'nav-tools';

  const clubsButton = document.createElement('button');
  clubsButton.className = 'dropdown-button';
  clubsButton.setAttribute('type', 'button');
  clubsButton.innerHTML = `
    Clubs
    <svg class="dropdown-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none"/>
    </svg>
  `;

  navTools.appendChild(clubsButton);

  // Add title from first fragment section to top row
  if (fragment && fragment.children.length > 0) {
    const sections = [...fragment.children];

    // First section contains title
    if (sections[0]) {
      const titleSection = sections[0];
      titleSection.classList.add('nav-title');
      topRow.appendChild(titleSection);
    }
  }

  // Assemble top row (title + tools)
  topRow.appendChild(navTools);
  nav.appendChild(topRow);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  // Add click handlers to navigation links for border-bottom effect
  const navLinks = nav.querySelectorAll('.nav-title a:any-link');
  navLinks.forEach((link) => {
    // Check if link is active based on current URL
    const linkPath = new URL(link.href, window.location).pathname;
    const currentPath = window.location.pathname;
    if (linkPath === currentPath || currentPath.startsWith(linkPath + '/')) {
      link.classList.add('active');
    }

    // Add click handler
    link.addEventListener('click', () => {
      // Remove active class from all links
      navLinks.forEach((l) => l.classList.remove('active', 'clicked'));
      // Add clicked class to the clicked link
      link.classList.add('clicked');
      
      // Store in sessionStorage to persist across page loads
      sessionStorage.setItem('activeNavLink', link.href);
    });
  });

  // Restore clicked state from sessionStorage
  const activeNavLink = sessionStorage.getItem('activeNavLink');
  if (activeNavLink) {
    navLinks.forEach((link) => {
      if (link.href === activeNavLink) {
        link.classList.add('clicked');
      }
    });
  }
}
