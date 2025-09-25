// cart-notification.js - Clean version for T4S themes
(function() {
  'use strict';
  
  // Configuration
  const NOTIFICATION_DURATION = 3000;
  const MINI_CART_ID = 't4s-mini_cart';
  
  // Create notification HTML
  function createNotificationHTML() {
    // Check if already exists
    if (document.getElementById('cart-notification-popup')) return;
    
    const notificationHTML = `
      <div id="cart-notification-popup" class="cart-notification-popup">
        <div class="notification-content">
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <p class="notification-text" 
             data-text-en="Product added to cart successfully!" 
             data-text-ar="تمت إضافة المنتج إلى السلة بنجاح!" 
             data-text-de="Produkt erfolgreich zum Warenkorb hinzugefügt!">
            Product added to cart successfully!
          </p>
        </div>
      </div>
    `;
    
    const div = document.createElement('div');
    div.innerHTML = notificationHTML;
    document.body.appendChild(div.firstElementChild);
  }
  
  // Get current language
  function getCurrentLanguage() {
    const lang = document.documentElement.lang || 
                 document.querySelector('html').getAttribute('lang') || 
                 window.Shopify?.locale || 
                 'en';
    return lang.toLowerCase().substring(0, 2);
  }
  
  // Show notification
  function showCartNotification() {
    // Remove any existing backdrops/overlays
    removeBackdrops();
    
    const popup = document.getElementById('cart-notification-popup');
    if (!popup) {
      createNotificationHTML();
      return showCartNotification();
    }
    
    const textElement = popup.querySelector('.notification-text');
    const currentLang = getCurrentLanguage();
    
    // Set localized text
    const textKey = `data-text-${currentLang}`;
    const localizedText = textElement.getAttribute(textKey) || 
                         textElement.getAttribute('data-text-en');
    textElement.textContent = localizedText;
    
    // Reset animations
    const checkmarkCircle = popup.querySelector('.checkmark-circle');
    const checkmarkCheck = popup.querySelector('.checkmark-check');
    checkmarkCircle.style.animation = 'none';
    checkmarkCheck.style.animation = 'none';
    popup.offsetHeight; // Force reflow
    checkmarkCircle.style.animation = '';
    checkmarkCheck.style.animation = '';
    
    // Show popup
    popup.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
      popup.classList.remove('show');
      // Clean up any backdrops that might have appeared
      removeBackdrops();
      // Ensure body is not locked
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.classList.remove('t4s-drawer-opened', 'cart-drawer-open', 'modal-open');
    }, NOTIFICATION_DURATION);
  }
  
  // Remove any backdrops or overlays
  function removeBackdrops() {
    // Remove all possible backdrop elements
    const backdrops = document.querySelectorAll(
      '.t4s-drawer-backdrop, .t4s-backdrop, .drawer-backdrop, ' +
      '.t4s-close-overlay, .cart-overlay, .drawer-overlay, ' +
      '.modal-backdrop, #modalOverlay, .overlay, .t4s-overlay'
    );
    
    backdrops.forEach(backdrop => {
      backdrop.style.display = 'none';
      backdrop.style.visibility = 'hidden';
      backdrop.remove();
    });
    
    // Ensure body is not locked
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.classList.remove('t4s-drawer-opened', 'cart-drawer-open', 'modal-open', 't4s-lock-scroll');
  }
  
  // Prevent T4S mini cart from opening
  function preventMiniCart() {
    // Hide mini cart element
    const miniCart = document.getElementById(MINI_CART_ID);
    if (miniCart) {
      miniCart.setAttribute('aria-hidden', 'true');
      miniCart.classList.add('t4s-dn');
      miniCart.classList.remove('t4s-drawer-opened', 't4s-is-open');
    }
    
    // Always remove backdrops when preventing mini cart
    removeBackdrops();
    
    // Override drawer open functions
    const originalOpen = window.t4sDrawerOpen || window.drawerOpen;
    if (originalOpen) {
      window.t4sDrawerOpen = window.drawerOpen = function(id) {
        if (id === MINI_CART_ID || id === 'cart' || id === 'mini-cart') {
          removeBackdrops(); // Remove any backdrop that might be created
          showCartNotification();
          return false;
        }
        return originalOpen.apply(this, arguments);
      };
    }
    
    // Override T4SThemeSP functions if they exist
    if (window.T4SThemeSP?.Drawer) {
      const originalDrawerOpen = window.T4SThemeSP.Drawer.open;
      window.T4SThemeSP.Drawer.open = function(id) {
        if (id === MINI_CART_ID || id === 'cart') {
          removeBackdrops(); // Remove any backdrop that might be created
          showCartNotification();
          return false;
        }
        if (originalDrawerOpen) {
          return originalDrawerOpen.apply(this, arguments);
        }
      };
    }
  }
  
  // Intercept cart operations
  function interceptCartOperations() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      // Check if it's a cart add request (not cart change/remove)
      const isCartAdd = typeof url === 'string' && url.includes('/cart/add');
      const isCartChange = typeof url === 'string' && url.includes('/cart/change');
      
      if (isCartAdd) {
        return originalFetch.apply(this, arguments).then(response => {
          if (response.ok) {
            // Show notification for add operations
            setTimeout(() => {
              preventMiniCart();
              showCartNotification();
            }, 50);
          }
          return response;
        });
      } else if (isCartChange) {
        // For cart change, check if it's a removal or quantity decrease
        return originalFetch.apply(this, arguments).then(response => {
          if (response.ok) {
            // Check the request body to see if quantity is 0 (removal) or being decreased
            const body = options?.body;
            if (body) {
              const bodyStr = body.toString();
              // Only prevent mini cart, don't show notification for removals
              if (bodyStr.includes('quantity=0') || bodyStr.includes('"quantity":0')) {
                // Item is being removed - just prevent mini cart, no notification
                setTimeout(() => preventMiniCart(), 50);
              } else {
                // Check if it's an increase (optional - you might not want notification for quantity changes)
                // For now, just prevent mini cart for all changes
                setTimeout(() => preventMiniCart(), 50);
              }
            } else {
              // No body info, just prevent mini cart
              setTimeout(() => preventMiniCart(), 50);
            }
          }
          return response;
        });
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      const xhr = this;
      const originalSend = xhr.send;
      let requestBody = '';
      
      // Capture the request body
      xhr.send = function(body) {
        requestBody = body ? body.toString() : '';
        return originalSend.apply(this, arguments);
      };
      
      xhr.addEventListener('load', function() {
        if (method === 'POST' && url) {
          if (url.includes('/cart/add')) {
            // Only show notification for actual add operations
            if (xhr.status >= 200 && xhr.status < 300) {
              setTimeout(() => {
                preventMiniCart();
                showCartNotification();
              }, 50);
            }
          } else if (url.includes('/cart/change')) {
            // For changes, just prevent mini cart without notification
            if (xhr.status >= 200 && xhr.status < 300) {
              // Check if it's a removal (quantity=0)
              if (!requestBody.includes('quantity=0') && !requestBody.includes('"quantity":0')) {
                // Not a removal, but still don't show notification for quantity changes
              }
              setTimeout(() => preventMiniCart(), 50);
            }
          }
        }
      });
      return originalXHROpen.apply(this, arguments);
    };
    
    // Listen for cart events
    ['cart:added', 'ajaxCart.afterCartLoad'].forEach(eventName => {
      document.addEventListener(eventName, function(e) {
        preventMiniCart();
        if (eventName === 'cart:added') {
          showCartNotification();
        }
      });
    });
    
    // Handle cart:refresh separately (doesn't need notification)
    document.addEventListener('cart:refresh', function(e) {
      preventMiniCart();
      // No notification for refresh events
    });
  }
  
  // Override cart drawer triggers
  function overrideCartTriggers() {
    // Override all elements that open cart drawer
    document.addEventListener('click', function(e) {
      const target = e.target.closest('[data-drawer-open], [data-action="open-drawer"], [data-cart-drawer-open]');
      
      if (target) {
        const drawerId = target.getAttribute('data-drawer-open') || 
                        target.getAttribute('data-cart-drawer-open');
        
        if (drawerId === MINI_CART_ID || drawerId === 'cart') {
          e.preventDefault();
          e.stopPropagation();
          
          // If it's adding to cart, let it proceed but show our notification
          if (target.hasAttribute('data-add-to-cart') || 
              target.querySelector('[name="add"]')) {
            // Cart add will be handled by interceptors
          } else {
            // Just opening cart drawer - redirect to cart page
            window.location.href = '/cart';
          }
          return false;
        }
      }
    }, true);
  }
  
  // Initialize everything
  function init() {
    // Create notification HTML
    createNotificationHTML();
    
    // Set up interceptors
    interceptCartOperations();
    
    // Override cart triggers
    overrideCartTriggers();
    
    // Prevent mini cart on page load
    preventMiniCart();
    
    // Keep checking for mini cart (for dynamic content)
    let checkCount = 0;
    const checkInterval = setInterval(function() {
      preventMiniCart();
      checkCount++;
      if (checkCount > 20) clearInterval(checkInterval); // Stop after 10 seconds
    }, 500);
    
    // Global test function
    window.testCartNotification = showCartNotification;
    
    console.log('✅ Cart notification system initialized');
  }
  
  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();