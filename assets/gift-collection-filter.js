/**
 * Gift Collection Search Filter
 * Hides 'free-gifts-collection' from all search interfaces
 * Version: 1.0.0
 */

(function() {
  'use strict';
  
  // Configuration
  const GIFT_COLLECTION_TERMS = [
    'free-gifts-collection',
    'free gifts collection',
    'free gift collection', 
    'free gifts',
    'gift collection',
    'مجموعة الهدايا المجانية', // Arabic if needed
    'هدايا مجانية'
  ];
  
  const DEBUG_MODE = false; // Set to true for debugging
  
  /**
   * Clear search-related cache items
   */
  function clearSearchCache() {
    if (typeof Storage === "undefined") return;
    
    try {
      // Clear sessionStorage items
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('Search') || key.includes('search') || key.includes('t4s') || key.includes('predictive'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        if (DEBUG_MODE) console.log('Removed sessionStorage key:', key);
      });
      
      // Clear localStorage search items
      const localKeysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('Search') || key.includes('search') || key.includes('t4s') || key.includes('predictive'))) {
          localKeysToRemove.push(key);
        }
      }
      localKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
        if (DEBUG_MODE) console.log('Removed localStorage key:', key);
      });
      
      if (DEBUG_MODE) {
        console.log('Gift Collection Filter: Search cache cleared successfully');
      }
    } catch(e) {
      if (DEBUG_MODE) console.error('Error clearing search cache:', e);
    }
  }
  
  /**
   * Check if search query contains gift collection terms
   */
  function containsGiftTerms(query) {
    if (!query) return false;
    const normalizedQuery = query.toLowerCase().trim();
    return GIFT_COLLECTION_TERMS.some(term => normalizedQuery.includes(term.toLowerCase()));
  }
  
  /**
   * Handle direct URL searches for gift collection
   */
  function handleDirectSearches() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery && containsGiftTerms(searchQuery)) {
      if (DEBUG_MODE) {
        console.log('Gift Collection Filter: Redirecting gift collection search:', searchQuery);
      }
      
      // Redirect to empty search or home page
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete('q'); // Remove search query entirely
      
      // Use replace to avoid back button issues
      window.location.replace(newUrl.toString() || '/search');
      return true;
    }
    return false;
  }
  
  /**
   * Intercept search form submissions
   */
  function interceptSearchForms() {
    // Find all search forms
    const searchForms = document.querySelectorAll('form[action*="search"], [data-frm-search]');
    
    searchForms.forEach(form => {
      form.addEventListener('submit', function(e) {
        const searchInput = form.querySelector('input[name="q"], [data-input-search]');
        if (searchInput && containsGiftTerms(searchInput.value)) {
          e.preventDefault();
          
          if (DEBUG_MODE) {
            console.log('Gift Collection Filter: Blocked form submission for gift collection search');
          }
          
          // Clear the input and show a message or redirect
          searchInput.value = '';
          
          // Optional: Show a subtle message
          showMessage('البحث غير متاح لهذا المصطلح'); // "Search not available for this term"
          
          return false;
        }
      });
    });
  }
  
  /**
   * Show a temporary message to user
   */
  function showMessage(text) {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.textContent = text;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    // Fade in
    setTimeout(() => messageEl.style.opacity = '1', 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => messageEl.remove(), 300);
    }, 3000);
  }
  
  /**
   * Debug function to verify filtering
   */
  function debugSearchResults() {
    if (!DEBUG_MODE) return;
    
    // Only run on search pages
    if (window.location.pathname.includes('/search')) {
      console.log('🔍 Gift Collection Filter: Search page detected');
      
      // Check search results after a delay
      setTimeout(function() {
        const productElements = document.querySelectorAll('[data-product-id], .t4s-product, .t4s-widget__pr');
        const collectionElements = document.querySelectorAll('[data-collection-handle], .t4s-collection-item');
        
        console.log(`📊 Search Results Summary:`);
        console.log(`   Products found: ${productElements.length}`);
        console.log(`   Collections found: ${collectionElements.length}`);
        
        // Check if any gift collection references exist
        const giftReferences = document.querySelectorAll('[href*="free-gifts"], [data-handle*="free-gifts"], [class*="free-gifts"]');
        if (giftReferences.length > 0) {
          console.warn(`⚠️  Found ${giftReferences.length} potential gift collection references - check filtering`);
        } else {
          console.log('✅ No gift collection references found - filtering working correctly');
        }
      }, 1000);
    }
  }
  
  /**
   * Monitor AJAX search requests
   */
  function monitorAjaxRequests() {
    // Override fetch to monitor search requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.includes('search') && DEBUG_MODE) {
        console.log('🌐 AJAX Search Request:', url);
      }
      return originalFetch.apply(this, arguments);
    };
  }
  
  /**
   * Initialize all filter functions
   */
  function init() {
    if (DEBUG_MODE) {
      console.log('🚀 Gift Collection Filter: Initializing...');
    }
    
    // Clear existing search cache
    clearSearchCache();
    
    // Handle direct URL searches
    const redirected = handleDirectSearches();
    if (redirected) return; // Don't continue if we're redirecting
    
    // Set up form interception
    interceptSearchForms();
    
    // Monitor AJAX requests in debug mode
    if (DEBUG_MODE) {
      monitorAjaxRequests();
    }
    
    // Debug search results
    debugSearchResults();
    
    // Re-run form interception after dynamic content loads
    setTimeout(interceptSearchForms, 2000);
    
    if (DEBUG_MODE) {
      console.log('✅ Gift Collection Filter: Initialization complete');
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Re-initialize on page navigation (for SPAs)
  window.addEventListener('popstate', init);
  
  // Export for manual testing in console
  if (DEBUG_MODE) {
    window.GiftCollectionFilter = {
      clearCache: clearSearchCache,
      checkTerms: containsGiftTerms,
      debug: debugSearchResults,
      reinit: init
    };
  }
  
})();