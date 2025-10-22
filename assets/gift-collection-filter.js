/**
 * Gift Collection Search Filter - FIXED VERSION
 * Hides 'free-gifts-collection' from all search interfaces
 * WITHOUT interfering with predictive search functionality
 * Version: 2.0.0 - FIXED
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
    'مجموعة الهدايا المجانية', // Arabic
    'هدايا مجانية'
  ];
  
  const DEBUG_MODE = false; // Set to true for debugging
  
  /**
   * Clear ONLY gift-related search cache items (selective clearing)
   * CRITICAL FIX: This prevents interference with predictive search functionality
   */
  function clearSearchCache() {
    if (typeof Storage === "undefined") return;
    
    try {
      // Only clear cache items that contain gift collection references
      const giftTermsPattern = /free[-_]?gift/i;
      
      // Clear sessionStorage items - but ONLY gift-related ones
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          // Check if the VALUE contains gift terms, not just the key
          try {
            const value = sessionStorage.getItem(key);
            if (value && giftTermsPattern.test(value)) {
              sessionKeysToRemove.push(key);
            }
          } catch(e) {
            // Skip if we can't read the value
          }
        }
      }
      sessionKeysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
        if (DEBUG_MODE) console.log('Removed sessionStorage key:', key);
      });
      
      // Clear localStorage search items - but ONLY gift-related ones  
      const localKeysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (value && giftTermsPattern.test(value)) {
              localKeysToRemove.push(key);
            }
          } catch(e) {
            // Skip if we can't read the value
          }
        }
      }
      localKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
        if (DEBUG_MODE) console.log('Removed localStorage key:', key);
      });
      
      if (DEBUG_MODE) {
        console.log('✅ Gift Collection Filter: Gift-related cache cleared (predictive search cache PRESERVED)');
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
      // Remove any existing listeners to prevent duplicates
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      newForm.addEventListener('submit', function(e) {
        const searchInput = this.querySelector('input[name="q"], [data-input-search]');
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
   * Monitor AJAX search requests (only in debug mode)
   */
  function monitorAjaxRequests() {
    if (!DEBUG_MODE) return;
    
    // Override fetch to monitor search requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      if (typeof url === 'string' && url.includes('search')) {
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
      console.log('🚀 Gift Collection Filter: Initializing (FIXED VERSION)...');
    }
    
    // CRITICAL FIX: Use selective cache clearing instead of clearing everything
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
    // FIXED: Reduced timeout to avoid conflicts
    setTimeout(interceptSearchForms, 1000);
    
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