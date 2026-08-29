(function () {
  const WIDGET_CONTAINER_ID = 'saas-search-widget';
  let API_URL = 'http://localhost:4001'; // Default fallback

  // Wait for DOM to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    const container = document.getElementById(WIDGET_CONTAINER_ID);
    if (!container) {
      console.warn(`Search Widget: Container with id "${WIDGET_CONTAINER_ID}" not found.`);
      return;
    }

    const projectId = container.getAttribute('data-project-id');
    if (!projectId) {
      console.error('Search Widget: "data-project-id" attribute is required.');
      return;
    }

    const customApiUrl = container.getAttribute('data-api-url');
    if (customApiUrl) {
      API_URL = customApiUrl;
    }

    injectCSS();
    renderUI(container, projectId);
  }

  function injectCSS() {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Reset & Base variables */
      #saas-widget-root {
        --saas-primary: #3b82f6;
        --saas-primary-hover: #2563eb;
        --saas-bg-glass: rgba(255, 255, 255, 0.85);
        --saas-border-glass: rgba(255, 255, 255, 0.3);
        --saas-text-main: #1f2937;
        --saas-text-muted: #6b7280;
        --saas-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        --saas-radius: 12px;
        --saas-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        
        font-family: system-ui, -apple-system, sans-serif;
      }

      @media (prefers-color-scheme: dark) {
        #saas-widget-root {
          --saas-bg-glass: rgba(17, 24, 39, 0.85);
          --saas-border-glass: rgba(255, 255, 255, 0.05);
          --saas-text-main: #f3f4f6;
          --saas-text-muted: #9ca3af;
          --saas-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
        }
      }

      /* Floating Button */
      .saas-floating-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: var(--saas-primary);
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--saas-transition);
        z-index: 9999;
      }
      .saas-floating-btn:hover {
        transform: translateY(-2px) scale(1.05);
        background-color: var(--saas-primary-hover);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.5);
      }
      .saas-floating-btn svg {
        width: 24px;
        height: 24px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* Modal Overlay */
      .saas-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        z-index: 10000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .saas-modal-overlay.saas-open {
        opacity: 1;
        pointer-events: auto;
      }

      /* Modal Content */
      .saas-modal-content {
        width: 90%;
        max-width: 600px;
        background: var(--saas-bg-glass);
        border: 1px solid var(--saas-border-glass);
        box-shadow: var(--saas-shadow);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: var(--saas-radius);
        overflow: hidden;
        transform: translateY(-20px) scale(0.95);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        flex-direction: column;
      }
      .saas-modal-overlay.saas-open .saas-modal-content {
        transform: translateY(0) scale(1);
      }

      /* Search Header */
      .saas-search-header {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        border-bottom: 1px solid var(--saas-border-glass);
      }
      .saas-search-icon {
        width: 20px;
        height: 20px;
        color: var(--saas-primary);
        margin-right: 12px;
      }
      .saas-search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 1.1rem;
        color: var(--saas-text-main);
        font-family: inherit;
      }
      .saas-search-input::placeholder {
        color: var(--saas-text-muted);
      }
      .saas-close-btn {
        background: transparent;
        border: none;
        color: var(--saas-text-muted);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: var(--saas-transition);
      }
      .saas-close-btn:hover {
        background: rgba(128, 128, 128, 0.1);
        color: var(--saas-text-main);
      }

      /* Results Area */
      .saas-results-container {
        max-height: 50vh;
        overflow-y: auto;
        padding: 12px 0;
      }
      .saas-results-container::-webkit-scrollbar {
        width: 8px;
      }
      .saas-results-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .saas-results-container::-webkit-scrollbar-thumb {
        background-color: var(--saas-border-glass);
        border-radius: 10px;
      }
      
      .saas-result-item {
        display: block;
        padding: 12px 24px;
        text-decoration: none;
        color: inherit;
        transition: var(--saas-transition);
      }
      .saas-result-item:hover {
        background: rgba(128, 128, 128, 0.05);
      }
      .saas-result-title {
        color: var(--saas-primary);
        font-weight: 600;
        margin: 0 0 4px 0;
        font-size: 1rem;
      }
      .saas-result-url {
        font-size: 0.75rem;
        color: var(--saas-text-muted);
        margin: 0 0 6px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .saas-result-snippet {
        font-size: 0.85rem;
        color: var(--saas-text-main);
        margin: 0;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .saas-empty-state {
        padding: 32px 24px;
        text-align: center;
        color: var(--saas-text-muted);
        font-size: 0.9rem;
      }
      
      .saas-loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(59, 130, 246, 0.2);
        border-top-color: var(--saas-primary);
        border-radius: 50%;
        animation: saas-spin 0.8s linear infinite;
        margin-right: 8px;
      }
      @keyframes saas-spin {
        to { transform: rotate(360deg); }
      }
      .saas-footer {
        padding: 8px 24px;
        border-top: 1px solid var(--saas-border-glass);
        font-size: 0.7rem;
        color: var(--saas-text-muted);
        text-align: right;
        background: rgba(128, 128, 128, 0.02);
      }
    `;
    document.head.appendChild(style);
  }

  function renderUI(container, projectId) {
    const root = document.createElement('div');
    root.id = 'saas-widget-root';

    // 1. Floating Button
    const btn = document.createElement('button');
    btn.className = 'saas-floating-btn';
    btn.setAttribute('aria-label', 'Search');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;

    // 2. Modal Overlay
    const overlay = document.createElement('div');
    overlay.className = 'saas-modal-overlay';

    // 3. Modal Content
    const modalContent = document.createElement('div');
    modalContent.className = 'saas-modal-content';

    // Header
    const header = document.createElement('div');
    header.className = 'saas-search-header';
    header.innerHTML = `
      <svg class="saas-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'saas-search-input';
    input.placeholder = 'Search docs, articles, content...';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'saas-close-btn';
    closeBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    header.appendChild(input);
    header.appendChild(closeBtn);

    // Results
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'saas-results-container';
    
    const footer = document.createElement('div');
    footer.className = 'saas-footer';
    footer.innerHTML = 'Powered by <strong>Search SAAS</strong>';

    modalContent.appendChild(header);
    modalContent.appendChild(resultsContainer);
    modalContent.appendChild(footer);
    overlay.appendChild(modalContent);

    root.appendChild(btn);
    root.appendChild(overlay);
    container.appendChild(root);

    // Interactions
    const openModal = () => {
      overlay.classList.add('saas-open');
      input.focus();
    };

    const closeModal = () => {
      overlay.classList.remove('saas-open');
      input.value = '';
      renderEmptyState('Type to start searching...');
    };

    btn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('saas-open')) {
        closeModal();
      }
    });

    // Debounced Search
    let debounceTimer;
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(debounceTimer);
      
      if (!query) {
        renderEmptyState('Type to start searching...');
        return;
      }

      resultsContainer.innerHTML = `
        <div class="saas-empty-state">
          <div class="saas-loading-spinner"></div>
          Searching...
        </div>
      `;

      debounceTimer = setTimeout(() => {
        performSearch(projectId, query, resultsContainer);
      }, 300);
    });

    // Initial state
    renderEmptyState('Type to start searching...');

    function renderEmptyState(message) {
      resultsContainer.innerHTML = `<div class="saas-empty-state">${message}</div>`;
    }
  }

  async function performSearch(projectId, query, container) {
    try {
      const res = await fetch(`${API_URL}/search/public/${projectId}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();

      if (results.length === 0) {
        container.innerHTML = '<div class="saas-empty-state">No results found.</div>';
        return;
      }

      container.innerHTML = results.map(item => `
        <a href="${item.url}" class="saas-result-item" target="_blank" rel="noopener noreferrer">
          <h4 class="saas-result-title">${item.title || item.url}</h4>
          <p class="saas-result-url">${item.url}</p>
          <p class="saas-result-snippet">${item.content || item.snippet || ''}</p>
        </a>
      `).join('');

    } catch (error) {
      console.error('Widget search error:', error);
      container.innerHTML = '<div class="saas-empty-state">An error occurred while searching.</div>';
    }
  }

})();
