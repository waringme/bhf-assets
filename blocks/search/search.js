/**
 * Search Block
 * Displays a search bar with input field, search icon, and search button.
 *
 * Block structure:
 * - Optional placeholder text in first cell
 * - Optional button text in second cell (defaults to "Search")
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Get configuration from block content
  let placeholder = 'What are you looking for?';
  let buttonText = 'Search';

  if (rows.length > 0) {
    const firstRow = rows[0];
    const cols = [...firstRow.children];

    if (cols[0]) {
      const text = cols[0].textContent.trim();
      if (text) placeholder = text;
    }

    if (cols[1]) {
      const text = cols[1].textContent.trim();
      if (text) buttonText = text;
    }
  }

  // Create search bar structure
  const searchBar = document.createElement('div');
  searchBar.className = 'search-bar';

  // Search icon
  const searchIcon = document.createElement('span');
  searchIcon.className = 'search-icon';
  searchIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M16.9,15.5c2.4-3.2,2.2-7.7-0.7-10.6c-3.1-3.1-8.1-3.1-11.3,0c-3.1,3.2-3.1,8.3,0,11.4
        c2.9,2.9,7.5,3.1,10.6,0.6c0,0.1,0,0.1,0,0.1l4.2,4.2c0.5,0.4,1.1,0.4,1.5,0c0.4-0.4,0.4-1,0-1.4L16.9,15.5
        C16.9,15.5,16.9,15.5,16.9,15.5L16.9,15.5z M14.8,6.3c2.3,2.3,2.3,6.1,0,8.5c-2.3,2.3-6.1,2.3-8.5,0C4,12.5,4,8.7,6.3,6.3
        C8.7,4,12.5,4,14.8,6.3z"/>
    </svg>
  `;

  // Input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);

  // Search button
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-button';
  button.textContent = buttonText;

  // Assemble search bar
  searchBar.appendChild(searchIcon);
  searchBar.appendChild(input);
  searchBar.appendChild(button);

  // Handle search submission
  const handleSearch = () => {
    const query = input.value.trim();
    if (query) {
      // Dispatch custom event for search
      window.dispatchEvent(new CustomEvent('site-search', {
        detail: { query },
      }));
      // Default behavior: could navigate to search results page
      // window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  button.addEventListener('click', handleSearch);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });

  block.textContent = '';
  block.appendChild(searchBar);
}
