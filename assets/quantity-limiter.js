// ==================================================
// HALA FOOD - ADVANCED QUANTITY LIMITER V6
// Multi-collection support with configurable limits
// ==================================================

(function() {
    'use strict';
    
    // Configuration from window object
    const CONFIG = window.HALA_QUANTITY_CONFIG || {
        collections: [
            { handle: '0-99', maxQuantity: 1, message: 'Limited to 1 per customer!' }
        ],
        defaultMessages: {
            alreadyMax: 'You have reached the maximum limit for this product!',
            limitReached: 'Maximum: {max} pieces per customer',
            addedToCart: 'Added to cart'
        }
    };
    
    // Get current locale
    const LOCALE = document.documentElement.lang || 'en';
    const IS_ARABIC = LOCALE.includes('ar');
    
    // Localized messages
    const MESSAGES = {
        ar: {
            alreadyMax: 'لقد وصلت إلى الحد الأقصى لهذا المنتج!',
            limitReached: 'الحد الأقصى: {max} قطعة لكل عميل',
            addedToCart: 'تمت الإضافة إلى السلة',
            productLimited: 'محدود بقطعة واحدة لكل عميل لهذا العرض الخاص!',
            quantityAdjusted: 'يمكنك اضافة قطعة واحدة فقط من كل منتج في هذا العرض',
            errorAdding: 'حدث خطأ في إضافة المنتج',
            maxLimit: 'الحد الأقصى: {max}'
        },
        en: {
            alreadyMax: 'You have reached the maximum limit for this product!',
            limitReached: 'Maximum: {max} pieces per customer',
            addedToCart: 'Added to cart',
            productLimited: 'Limited to 1 per customer for this special offer!',
            quantityAdjusted: 'Adjusted "{product}" quantity to {max} (maximum limit)',
            errorAdding: 'Error adding product',
            maxLimit: 'Max: {max}'
        }
    };
    
    // Flag to prevent mini cart from opening
    let preventMiniCartOpen = false;
    
    // Get localized message
    function getMessage(key, replacements = {}) {
        const messages = IS_ARABIC ? MESSAGES.ar : MESSAGES.en;
        let message = messages[key] || MESSAGES.en[key] || key;
        
        // Replace placeholders
        Object.keys(replacements).forEach(placeholder => {
            message = message.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        
        return message;
    }
    
    // State management
    const state = {
        cartData: null,
        collectionProducts: new Map(), // Map of productId -> {collectionHandle, maxQuantity}
        isProcessing: false,
        observerActive: false,
        initialized: false,
        interceptedForms: new WeakSet(), // Track intercepted forms
        processingProducts: new Set() // Track products being processed
    };
    
    // Cache for performance
    const cache = {
        productLimits: new Map(), // productId -> maxQuantity
        lastCartUpdate: 0,
        cartUpdateInterval: 300, // Faster updates
        productVariants: new Map() // productId -> [variantIds]
    };
    
    // Theme-specific selectors
    const SELECTORS = {
        // Forms and buttons
        productForms: 'form[action*="/cart/add"], .t4s-form__product, form[data-type="add-to-cart-form"]',
        addToCartButtons: '.t4s-product-form__submit, [data-atc-form], button[type="submit"][name="add"], [data-action-atc], .t4s-pr-atc, .t4s-btn-atc',
        
        // Cart elements
        cartItems: '[data-cart-item]',
        cartDrawer: '#t4s-mini_cart, .t4s-mini_cart__container',
        
        // Quantity controls
        quantityInputs: '.t4s-quantity-input, .qty-input, input[data-quantity-input], input[data-action-change], input[data-quantity-value]',
        plusButtons: '.t4s-quantity-selector.is--plus, [data-quantity-plus], .qty-btn.plus, [data-increase-qty]',
        minusButtons: '.t4s-quantity-selector.is--minus, [data-quantity-minus], .qty-btn.minus, [data-decrease-qty]',
        
        // Product containers
        productContainers: '[data-product-id], [data-productid], .t4s-product, [data-product-featured], [data-product-options]'
    };
    
    // Override mini cart opening functions
    function preventMiniCartForLimitedProducts() {
        // Store original drawer open function
        if (window.T4SThemeSP && window.T4SThemeSP.Drawer) {
            const originalOpen = window.T4SThemeSP.Drawer.open;
            window.T4SThemeSP.Drawer.open = function(...args) {
                if (preventMiniCartOpen) {
                    console.log('HALA: Prevented mini cart opening for limited product');
                    return;
                }
                return originalOpen.apply(this, args);
            };
        }
        
        // Intercept drawer events
        document.addEventListener('drawer:open', function(e) {
            if (preventMiniCartOpen && (
                e.detail?.id === 't4s-mini_cart' ||
                e.detail?.drawer === 'cart' ||
                e.detail?.type === 'cart'
            )) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);
    }
    
    // ==================================================
    // CORE FUNCTIONS
    // ==================================================
    
    async function fetchCartData(force = false) {
        const now = Date.now();
        if (!force && state.cartData && (now - cache.lastCartUpdate) < cache.cartUpdateInterval) {
            return state.cartData;
        }
        
        try {
            const response = await fetch('/cart.js?' + now, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            state.cartData = await response.json();
            cache.lastCartUpdate = now;
            console.log('HALA: Cart updated, items:', state.cartData.item_count);
            return state.cartData;
        } catch (error) {
            console.error('HALA: Error fetching cart:', error);
            return null;
        }
    }
    
    async function loadCollectionProducts() {
        console.log('HALA: Loading collection products...');
        
        // Clear existing data
        state.collectionProducts.clear();
        cache.productLimits.clear();
        cache.productVariants.clear();
        
        // Use preloaded data if available
        if (window.HALA_COLLECTION_PRODUCTS) {
            CONFIG.collections.forEach(config => {
                const products = window.HALA_COLLECTION_PRODUCTS[config.handle] || [];
                products.forEach(product => {
                    const productId = parseInt(product.id);
                    state.collectionProducts.set(productId, {
                        collectionHandle: config.handle,
                        maxQuantity: config.maxQuantity,
                        message: config.message || getMessage('limitReached', { max: config.maxQuantity })
                    });
                    cache.productLimits.set(productId, config.maxQuantity);
                });
            });
            console.log('HALA: Loaded products from preloaded data');
            return;
        }
        
        // Fetch collection data if not preloaded
        const fetchPromises = CONFIG.collections.map(async (config) => {
            try {
                const response = await fetch(`/collections/${config.handle}/products.json?limit=250`);
                const data = await response.json();
                
                data.products.forEach(product => {
                    const productId = parseInt(product.id);
                    state.collectionProducts.set(productId, {
                        collectionHandle: config.handle,
                        maxQuantity: config.maxQuantity,
                        message: config.message || getMessage('limitReached', { max: config.maxQuantity })
                    });
                    cache.productLimits.set(productId, config.maxQuantity);
                    
                    // Store variant IDs
                    if (product.variants) {
                        const variantIds = product.variants.map(v => parseInt(v.id));
                        cache.productVariants.set(productId, variantIds);
                    }
                });
                
                console.log(`HALA: Loaded ${data.products.length} products from collection "${config.handle}"`);
            } catch (error) {
                console.error(`HALA: Error loading collection "${config.handle}":`, error);
            }
        });
        
        await Promise.all(fetchPromises);
        console.log(`HALA: Total products with limits: ${state.collectionProducts.size}`);
    }
    
    function getProductLimit(productId) {
        const id = parseInt(productId);
        return cache.productLimits.get(id) || null;
    }
    
    function getProductLimitInfo(productId) {
        const id = parseInt(productId);
        return state.collectionProducts.get(id) || null;
    }
    
    function getProductQuantityInCart(productId) {
        if (!state.cartData || !state.cartData.items) return 0;
        
        const id = parseInt(productId);
        // Sum ALL quantities for this product across all line items
        return state.cartData.items
            .filter(item => parseInt(item.product_id) === id)
            .reduce((total, item) => total + item.quantity, 0);
    }
    
    function getExistingCartItem(productId, variantId = null) {
        if (!state.cartData || !state.cartData.items) return null;
        
        const id = parseInt(productId);
        
        // If variantId provided, find exact match
        if (variantId) {
            return state.cartData.items.find(item => 
                parseInt(item.product_id) === id && 
                parseInt(item.variant_id) === parseInt(variantId)
            );
        }
        
        // Otherwise, find any item for this product
        return state.cartData.items.find(item => parseInt(item.product_id) === id);
    }
    
    function canAddToCart(productId, requestedQuantity = 1) {
        const limit = getProductLimit(productId);
        if (!limit) return { allowed: true };
        
        const currentQuantity = getProductQuantityInCart(productId);
        const totalQuantity = currentQuantity + requestedQuantity;
        
        console.log('HALA: Checking can add to cart', {
            productId,
            currentQuantity,
            requestedQuantity,
            totalQuantity,
            limit
        });
        
        // Strict check - if at limit, don't allow any more
        if (currentQuantity >= limit) {
            const limitInfo = getProductLimitInfo(productId);
            return {
                allowed: false,
                message: limitInfo?.message || getMessage('alreadyMax'),
                currentQuantity,
                maxQuantity: limit,
                canAddMore: 0
            };
        }
        
        // If would exceed limit
        if (totalQuantity > limit) {
            const limitInfo = getProductLimitInfo(productId);
            return {
                allowed: false,
                message: limitInfo?.message || getMessage('alreadyMax'),
                currentQuantity,
                maxQuantity: limit,
                canAddMore: limit - currentQuantity
            };
        }
        
        return { 
            allowed: true, 
            currentQuantity, 
            maxQuantity: limit,
            canAddMore: limit - currentQuantity
        };
    }
    
    function getProductIdFromElement(element) {
        if (!element) return null;
        
        // Try multiple methods to find product ID
        const methods = [
            // Direct attributes
            () => element.dataset.productId || element.dataset.productid || element.dataset.id,
            () => element.getAttribute('data-product-id') || element.getAttribute('data-productid'),
            
            // From parent form
            () => {
                const form = element.closest('form');
                if (form) {
                    return form.dataset.productid || form.dataset.productId || 
                           form.getAttribute('data-productid') || form.getAttribute('data-product-id');
                }
            },
            
            // From product JSON script
            () => {
                const container = element.closest('.t4s-product__info-container, .t4s-popup__content, .t4s-modal__content, [data-product-featured]');
                if (container) {
                    const productJson = container.querySelector('[data-product-json]');
                    if (productJson) {
                        try {
                            const data = JSON.parse(productJson.textContent);
                            return data.id;
                        } catch (e) {}
                    }
                }
            },
            
            // From product options data
            () => {
                const container = element.closest('[data-product-options]');
                if (container) {
                    const options = container.getAttribute('data-product-options');
                    if (options) {
                        try {
                            const data = JSON.parse(options);
                            return data.id;
                        } catch (e) {}
                    }
                }
            },
            
            // From any parent with product ID
            () => {
                const parent = element.closest('[data-product-id], [data-productid]');
                if (parent) {
                    return parent.dataset.productId || parent.dataset.productid ||
                           parent.getAttribute('data-product-id') || parent.getAttribute('data-productid');
                }
            }
        ];
        
        for (const method of methods) {
            const id = method();
            if (id) return parseInt(id);
        }
        
        return null;
    }
    
    // ==================================================
    // NOTIFICATION SYSTEM
    // ==================================================
    
    function showNotification(message, type = 'warning', duration = 5000) {
        // Remove existing notifications
        document.querySelectorAll('.hala-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `hala-notification hala-notification--${type}`;
        notification.innerHTML = `
            <div class="hala-notification__content">
                <span class="hala-notification__icon">${type === 'success' ? '✓' : '⚡'}</span>
                <div class="hala-notification__text">${message}</div>
                <button class="hala-notification__close">×</button>
            </div>
        `;
        
        // Ensure styles exist
        if (!document.querySelector('#hala-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'hala-notification-styles';
            style.textContent = `
                .hala-notification {
                    position: fixed;
                    top: 80px;
                    ${IS_ARABIC ? 'left: 20px;' : 'right: 20px;'}
                    background: #333;
                    color: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 999999;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                    font-size: 14px;
                    line-height: 1.4;
                    direction: ${IS_ARABIC ? 'rtl' : 'ltr'};
                }
                .hala-notification--error {
                    background: #dc3545;
                }
                .hala-notification--success {
                    background: #28a745;
                }
                .hala-notification--warning {
                    background: #ff6b35;
                }
                .hala-notification__content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .hala-notification__icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .hala-notification__text {
                    flex: 1;
                }
                .hala-notification__close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    margin-${IS_ARABIC ? 'right' : 'left'}: 12px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .hala-notification__close:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from { transform: translateX(${IS_ARABIC ? '-120%' : '120%'}); }
                    to { transform: translateX(0); }
                }
                @media (max-width: 768px) {
                    .hala-notification {
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }
                }
                /* Fix for clickable elements in offer products */
                .hala-offer-product-card form,
                .hala-offer-product-form {
                    position: relative;
                    z-index: 10;
                }
                .t4s-popup .t4s-product-form__variants,
                .t4s-modal .t4s-product-form__variants {
                    pointer-events: auto !important;
                }
                .t4s-popup__content,
                .t4s-modal__content {
                    position: relative;
                    z-index: 1;
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.querySelector('.hala-notification__close').onclick = () => notification.remove();
        document.body.appendChild(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }
    
    // ==================================================
    // FORM AND BUTTON INTERCEPTION
    // ==================================================
    
    function interceptForms() {
        // Global form submit interceptor
        document.addEventListener('submit', handleGlobalFormSubmit, true);
        
        // Global click interceptor for buttons
        document.addEventListener('click', handleGlobalClick, true);
        
        // Intercept all existing forms
        document.querySelectorAll(SELECTORS.productForms).forEach(form => {
            interceptSingleForm(form);
        });
    }
    
    function interceptSingleForm(form) {
        if (state.interceptedForms.has(form)) return;
        
        // Mark as intercepted
        state.interceptedForms.add(form);
        
        // Override the form's submit method
        const originalSubmit = form.submit;
        form.submit = async function() {
            const productId = getProductIdFromElement(form);
            if (productId) {
                // Always check against latest cart
                await fetchCartData(true);
                const checkResult = canAddToCart(productId, 1);
                if (!checkResult.allowed) {
                    console.log('HALA: Blocked form.submit() for product', productId);
                    const limitInfo = getProductLimitInfo(productId);
                    showNotification(limitInfo?.message || getMessage('alreadyMax'), 'error');
                    return false;
                }
            }
            return originalSubmit.apply(this, arguments);
        };
        
        // Add submit event listener
        form.addEventListener('submit', handleFormSubmit, true);
    }
    
    function handleGlobalFormSubmit(e) {
        const form = e.target;
        if (!form.matches(SELECTORS.productForms)) return;
        
        // Intercept if not already done
        if (!state.interceptedForms.has(form)) {
            interceptSingleForm(form);
        }
        
        handleFormSubmit(e);
    }
    
    function handleGlobalClick(e) {
        const button = e.target.closest(SELECTORS.addToCartButtons);
        if (!button) return;
        
        // Check if it's in a form
        const form = button.closest('form');
        if (form && form.matches(SELECTORS.productForms)) {
            // Will be handled by form submit
            return;
        }
        
        handleButtonClick(e);
    }
    
      async function handleFormSubmit(e) {
          // Always prevent default first
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          const form = e.currentTarget || e.target;
          
          if (state.isProcessing) {
              return false;
          }
          
          const productId = getProductIdFromElement(form);
          
          console.log('HALA DEBUG: Form submission intercepted', {
              form: form,
              productId: productId
          });
          
          if (!productId) {
              console.log('HALA: No product ID found for form');
              // Let it proceed if we can't determine the product
              form.submit();
              return;
          }
          
          const limitInfo = getProductLimitInfo(productId);
          if (!limitInfo) {
              // No limit for this product, let it proceed
              form.submit();
              return;
          }
          
          // SET FLAG TO PREVENT MINI CART OPENING
          preventMiniCartOpen = true;
          
          // Check if this product is already being processed
          if (state.processingProducts.has(productId)) {
              console.log('HALA: Product already being processed:', productId);
              return false;
          }
          
          state.isProcessing = true;
          state.processingProducts.add(productId);
          
          try {
              // Always fetch latest cart data
              await fetchCartData(true);
              
              // Get requested quantity
              const quantityInput = form.querySelector('input[name="quantity"]');
              const requestedQuantity = parseInt(quantityInput?.value || 1);
              
              // Check current quantity in cart FIRST
              const currentQuantityInCart = getProductQuantityInCart(productId);
              
              // If already at or above limit, block immediately
              if (currentQuantityInCart >= limitInfo.maxQuantity) {
                  showNotification(limitInfo.message || getMessage('alreadyMax'), 'error');
                  
                  // Update button state
                  const submitButton = form.querySelector('button[type="submit"], .t4s-product-form__submit');
                  if (submitButton) {
                      const originalHTML = submitButton.innerHTML;
                      const originalDisabled = submitButton.disabled;
                      submitButton.disabled = true;
                      submitButton.innerHTML = `<span>${getMessage('maxLimit', { max: limitInfo.maxQuantity })}</span>`;
                      
                      setTimeout(() => {
                          submitButton.disabled = originalDisabled;
                          submitButton.innerHTML = originalHTML;
                      }, 3000);
                  }
                  
                  return false;
              }
              
              // Check if adding would exceed limit
              const checkResult = canAddToCart(productId, requestedQuantity);
              
              if (!checkResult.allowed) {
                  showNotification(checkResult.message || getMessage('alreadyMax'), 'error');
                  
                  // Update button state
                  const submitButton = form.querySelector('button[type="submit"], .t4s-product-form__submit');
                  if (submitButton) {
                      const originalHTML = submitButton.innerHTML;
                      const originalDisabled = submitButton.disabled;
                      submitButton.disabled = true;
                      submitButton.innerHTML = `<span>${getMessage('maxLimit', { max: checkResult.maxQuantity })}</span>`;
                      
                      setTimeout(() => {
                          submitButton.disabled = originalDisabled;
                          submitButton.innerHTML = originalHTML;
                      }, 3000);
                  }
                  
                  return false;
              }
              
              // Get variant ID
              const variantInput = form.querySelector('input[name="id"], select[name="id"]');
              const variantId = variantInput ? parseInt(variantInput.value) : null;
              
              // Check if this item already exists in cart
              const existingItem = getExistingCartItem(productId, variantId);
              
              // IMPORTANT FIX: Don't allow any updates if already at max
              if (existingItem && existingItem.quantity >= limitInfo.maxQuantity) {
                  showNotification(limitInfo.message || getMessage('alreadyMax'), 'error');
                  return false;
              }
              
              // If exists and we can add more, update quantity instead
              if (existingItem && checkResult.canAddMore > 0) {
                  // Calculate new quantity but ensure it doesn't exceed limit
                  const desiredQuantity = existingItem.quantity + requestedQuantity;
                  const newQuantity = Math.min(desiredQuantity, checkResult.maxQuantity);
                  
                  // If new quantity would be same as current, block
                  if (newQuantity === existingItem.quantity) {
                      showNotification(limitInfo.message || getMessage('alreadyMax'), 'error');
                      return false;
                  }
                  
                  const updates = {};
                  updates[existingItem.key] = newQuantity;
                  
                  const response = await fetch('/cart/update.js', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ updates })
                  });
                  
                  if (response.ok) {
                      showNotification(getMessage('addedToCart'), 'success', 2000);
                      await fetchCartData(true);
                      updateCartQuantityControls();
                      
                      // Dispatch events
                      document.dispatchEvent(new CustomEvent('cart:updated'));
                      window.dispatchEvent(new CustomEvent('cart:updated'));
                      
                      // Update theme cart
                      updateThemeCart();
                      
                      // Close modals
                      closeModals();
                  }
              } else if (!existingItem) {
                  // Add new item only if we're not at limit
                  const formData = new FormData(form);
                  
                  const response = await fetch('/cart/add.js', {
                      method: 'POST',
                      body: formData
                  });
                  
                  if (response.ok) {
                      showNotification(getMessage('addedToCart'), 'success', 2000);
                      
                      // Update cart immediately
                      await fetchCartData(true);
                      updateCartQuantityControls();
                      
                      // Dispatch events
                      document.dispatchEvent(new CustomEvent('cart:updated'));
                      window.dispatchEvent(new CustomEvent('cart:updated'));
                      
                      // Update theme cart
                      updateThemeCart();
                      
                      // Close modals
                      closeModals();
                  } else {
                      const errorText = await response.text();
                      console.error('HALA: Error adding to cart:', errorText);
                      showNotification(getMessage('errorAdding'), 'error');
                  }
              }
              
          } catch (error) {
              console.error('HALA: Error in form submission:', error);
              showNotification(getMessage('errorAdding'), 'error');
          } finally {
              setTimeout(() => {
                  state.isProcessing = false;
                  state.processingProducts.delete(productId);
                  preventMiniCartOpen = false; // Reset the flag
              }, 1000);
          }
          
          return false;
      }
    
    async function handleButtonClick(e) {
        const button = e.currentTarget || e.target;
        const productId = getProductIdFromElement(button);
        
        if (!productId) return;
        
        const limitInfo = getProductLimitInfo(productId);
        if (!limitInfo) return;
        
        // Always prevent default
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (state.isProcessing || state.processingProducts.has(productId)) {
            return false;
        }
        
        state.isProcessing = true;
        state.processingProducts.add(productId);
        
        try {
            // Always fetch latest cart data
            await fetchCartData(true);
            
            const checkResult = canAddToCart(productId, 1);
            
            if (!checkResult.allowed) {
                showNotification(checkResult.message || getMessage('alreadyMax'), 'error');
                
                // Visual feedback
                const originalText = button.textContent;
                button.disabled = true;
                button.textContent = getMessage('maxLimit', { max: checkResult.maxQuantity });
                
                setTimeout(() => {
                    button.disabled = false;
                    button.textContent = originalText;
                }, 2000);
                
                return false;
            }
        } finally {
            setTimeout(() => {
                state.isProcessing = false;
                state.processingProducts.delete(productId);
            }, 200);
        }
    }
    
    // ==================================================
    // HELPER FUNCTIONS
    // ==================================================
    
    function updateThemeCart() {
        // Check if we should prevent mini cart opening
        if (preventMiniCartOpen) {
            // Only update cart data without opening the drawer
            if (window.theme && typeof window.theme.cart !== 'undefined') {
                window.theme.cart.getCart();
            }
            if (window.cartT4S && typeof window.cartT4S.getCart === 'function') {
                window.cartT4S.getCart();
            }
            
            // Update cart count only
            fetch('/cart.js')
                .then(res => res.json())
                .then(cart => {
                    const cartCounts = document.querySelectorAll('.t4s-cart-count, [data-cart-count], .t4s-cart-bubble');
                    cartCounts.forEach(el => {
                        el.textContent = cart.item_count;
                        el.innerText = cart.item_count;
                    });
                });
            
            // Trigger events without opening drawer
            if (window.jQuery || window.$) {
                const $ = window.jQuery || window.$;
                $(document).trigger('cart:refresh');
                $(document).trigger('cart:updated');
            }
            
            document.dispatchEvent(new CustomEvent('theme:cart:updated'));
            document.dispatchEvent(new CustomEvent('cart:refresh'));
            
            return;
        }
        
        // Theme specific cart updates
        if (window.theme && typeof window.theme.cart !== 'undefined') {
            window.theme.cart.getCart();
        }
        if (window.cart && typeof window.cart.getCart === 'function') {
            window.cart.getCart();
        }
        if (window.ajaxCart && typeof window.ajaxCart.load === 'function') {
            window.ajaxCart.load();
        }
        if (window.cartT4S && typeof window.cartT4S.getCart === 'function') {
            window.cartT4S.getCart();
        }
        
        // T4S Theme specific cart refresh - Without opening drawer
        setTimeout(() => {
            // Method 1: Trigger T4S cart refresh events
            if (window.T4SThemeSP && window.T4SThemeSP.cart) {
                window.T4SThemeSP.cart.init && window.T4SThemeSP.cart.init();
            }
            
            // Method 2: Update cart count
            const minicart = document.querySelector('#t4s-mini_cart, .t4s-mini_cart__container, .t4s-cart-drawer');
            if (minicart) {
                // Find the cart items container
                const cartItems = minicart.querySelector('.t4s-mini_cart__items, .t4s-cart-items, [data-cart-items]');
                if (cartItems) {
                    // Fetch updated cart and update count
                    fetch('/cart.js')
                        .then(res => res.json())
                        .then(cart => {
                            // Update cart count
                            const cartCounts = document.querySelectorAll('.t4s-cart-count, [data-cart-count], .t4s-cart-bubble');
                            cartCounts.forEach(el => {
                                el.textContent = cart.item_count;
                                el.innerText = cart.item_count;
                            });
                        });
                }
            }
            
            // Method 3: Trigger jQuery events
            if (window.jQuery || window.$) {
                const $ = window.jQuery || window.$;
                $(document).trigger('cart:refresh');
                $(document).trigger('cart:updated');
                $(document).trigger('ajaxCart:updated');
                $('body').trigger('refreshCurrency');
                $('.t4s-mini_cart__container').trigger('refresh');
            }
            
            // Method 4: Dispatch native events
            document.dispatchEvent(new CustomEvent('theme:cart:updated'));
            document.dispatchEvent(new CustomEvent('cart:refresh'));
            window.dispatchEvent(new Event('resize')); // Sometimes triggers cart refresh
            
        }, 100);
    }
    
    function closeModals() {
        const closeButtons = document.querySelectorAll(
            '.t4s-modal.is--open .t4s-close, ' +
            '.t4s-popup.is--open .t4s-close, ' +
            '.t4s-drawer__close, ' +
            '.mfp-close'
        );
        closeButtons.forEach(btn => btn.click());
    }
    
    // ==================================================
    // CART QUANTITY CONTROL
    // ==================================================
    
    function updateCartQuantityControls() {
        if (!state.cartData || !state.cartData.items) return;
        
        state.cartData.items.forEach(item => {
            const limitInfo = getProductLimitInfo(item.product_id);
            if (!limitInfo) return;
            
            const maxQuantity = limitInfo.maxQuantity;
            
            // Find all controls for this item
            const selectors = [
                `[data-variant-id="${item.variant_id}"]`,
                `[data-line-item-key="${item.key}"]`,
                `[data-cart-item*="${item.variant_id}"]`
            ];
            
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    // Update quantity input
                    const input = element.querySelector(SELECTORS.quantityInputs);
                    if (input) {
                        input.setAttribute('max', maxQuantity);
                        input.setAttribute('data-limit', maxQuantity);
                        
                        if (parseInt(input.value) > maxQuantity) {
                            input.value = maxQuantity;
                            updateCartItemQuantity(item.key, maxQuantity);
                        }
                        
                        // Add listeners
                        input.removeEventListener('change', handleQuantityInputChange);
                        input.addEventListener('change', handleQuantityInputChange);
                    }
                    
                    // Update plus button
                    const plusButton = element.querySelector(SELECTORS.plusButtons);
                    if (plusButton) {
                        if (item.quantity >= maxQuantity) {
                            plusButton.disabled = true;
                            plusButton.style.opacity = '0.5';
                            plusButton.style.cursor = 'not-allowed';
                            plusButton.setAttribute('title', limitInfo.message);
                            
                            // Remove all existing listeners and add blocker
                            const newButton = plusButton.cloneNode(true);
                            plusButton.parentNode.replaceChild(newButton, plusButton);
                            newButton.addEventListener('click', blockMaxQuantityClick, true);
                        } else {
                            plusButton.disabled = false;
                            plusButton.style.opacity = '';
                            plusButton.style.cursor = '';
                        }
                    }
                });
            });
        });
    }
    
    function handleQuantityInputChange(e) {
        const input = e.target;
        const maxQuantity = parseInt(input.getAttribute('data-limit'));
        if (!maxQuantity) return;
        
        const newQuantity = parseInt(input.value);
        if (newQuantity > maxQuantity) {
            input.value = maxQuantity;
            showNotification(
                getMessage('limitReached', { max: maxQuantity }),
                'warning'
            );
            
            const cartItem = input.closest('[data-line-item-key]');
            if (cartItem) {
                const key = cartItem.dataset.lineItemKey;
                updateCartItemQuantity(key, maxQuantity);
            }
        }
    }
    
    function blockMaxQuantityClick(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const button = e.currentTarget;
        const cartItem = button.closest('[data-variant-id], [data-cart-item]');
        if (cartItem) {
            const variantId = cartItem.dataset.variantId || cartItem.querySelector('[data-variant-id]')?.dataset.variantId;
            if (variantId) {
                const item = state.cartData.items.find(i => i.variant_id.toString() === variantId.toString());
                if (item) {
                    const limitInfo = getProductLimitInfo(item.product_id);
                    if (limitInfo) {
                        showNotification(limitInfo.message, 'warning');
                    }
                }
            }
        }
        
        return false;
    }
    
    async function updateCartItemQuantity(key, quantity) {
        try {
            const updates = {};
            updates[key] = quantity;
            
            const response = await fetch('/cart/update.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates })
            });
            
            if (response.ok) {
                await fetchCartData(true);
                document.dispatchEvent(new CustomEvent('cart:updated'));
                window.dispatchEvent(new CustomEvent('cart:updated'));
                updateThemeCart();
            }
        } catch (error) {
            console.error('HALA: Error updating cart:', error);
        }
    }
    
    // ==================================================
    // AJAX INTERCEPTION
    // ==================================================
    
    function interceptAjaxRequests() {
        // Override XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;
            const originalSend = xhr.send;
            
            xhr.open = function(method, url, ...args) {
                xhr._url = url;
                xhr._method = method;
                return originalOpen.apply(this, [method, url, ...args]);
            };
            
            xhr.send = function(data) {
                if (xhr._method === 'POST' && xhr._url && xhr._url.includes('/cart/add')) {
                    // Add response interceptor
                    const originalOnload = xhr.onload;
                    xhr.onload = async function() {
                        if (xhr.status === 200) {
                            // Cart was updated, check limits
                            setTimeout(async () => {
                                await fetchCartData(true);
                                await enforceCartLimits();
                                updateCartQuantityControls();
                            }, 100);
                        }
                        if (originalOnload) originalOnload.apply(this, arguments);
                    };
                }
                
                return originalSend.apply(this, [data]);
            };
            
            return xhr;
        };
        
        // Override fetch
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [url, options = {}] = args;
            
            const response = await originalFetch.apply(this, args);
            
            // Check cart after successful operations
            if (response.ok && typeof url === 'string' && 
                (url.includes('/cart/add') || url.includes('/cart/change') || url.includes('/cart/update'))) {
                
                setTimeout(async () => {
                    await fetchCartData(true);
                    await enforceCartLimits();
                    updateCartQuantityControls();
                }, 200);
            }
            
            return response;
        };
    }
    
    // ==================================================
    // CART LIMIT ENFORCEMENT
    // ==================================================
    
    async function enforceCartLimits() {
        if (!state.cartData || !state.cartData.items) return;
        
        let hasChanges = false;
        const updates = {};
        
        // Check each item
        for (const item of state.cartData.items) {
            const limitInfo = getProductLimitInfo(item.product_id);
            if (limitInfo && item.quantity > limitInfo.maxQuantity) {
                updates[item.key] = limitInfo.maxQuantity;
                hasChanges = true;
                
                showNotification(
                    getMessage('quantityAdjusted', { 
                        product: item.product_title, 
                        max: limitInfo.maxQuantity 
                    }),
                    'warning',
                    5000
                );
            }
        }
        
        // Check for duplicate items
        const productMap = new Map();
        state.cartData.items.forEach(item => {
            const productId = item.product_id.toString();
            if (!productMap.has(productId)) {
                productMap.set(productId, []);
            }
            productMap.get(productId).push(item);
        });
        
        // Consolidate duplicates
        for (const [productId, items] of productMap.entries()) {
            if (items.length > 1) {
                const limitInfo = getProductLimitInfo(parseInt(productId));
                const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
                const maxQuantity = limitInfo ? limitInfo.maxQuantity : totalQuantity;
                const finalQuantity = Math.min(totalQuantity, maxQuantity);
                
                // Keep first item with final quantity
                updates[items[0].key] = finalQuantity;
                
                // Remove other items
                for (let i = 1; i < items.length; i++) {
                    updates[items[i].key] = 0;
                }
                
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            try {
                const response = await fetch('/cart/update.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ updates })
                });
                
                if (response.ok) {
                    await fetchCartData(true);
                    updateCartQuantityControls();
                    
                    // Dispatch events
                    document.dispatchEvent(new CustomEvent('cart:updated'));
                    window.dispatchEvent(new CustomEvent('cart:updated'));
                    updateThemeCart();
                }
            } catch (error) {
                console.error('HALA: Error enforcing cart limits:', error);
            }
        }
    }
    
    // ==================================================
    // DOM OBSERVER
    // ==================================================
    
    function startDOMObserver() {
        if (state.observerActive) return;
        
        const observer = new MutationObserver((mutations) => {
            let needsFormCheck = false;
            let needsCartCheck = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (node.matches?.(SELECTORS.productForms) || 
                                node.querySelector?.(SELECTORS.productForms)) {
                                needsFormCheck = true;
                            }
                            
                            if (node.matches?.(SELECTORS.cartItems) ||
                                node.querySelector?.(SELECTORS.cartItems)) {
                                needsCartCheck = true;
                            }
                            
                            if (node.classList?.contains('t4s-modal') ||
                                node.classList?.contains('t4s-popup')) {
                                needsFormCheck = true;
                            }
                        }
                    }
                }
            }
            
            if (needsFormCheck) {
                setTimeout(() => {
                    // Intercept new forms
                    document.querySelectorAll(SELECTORS.productForms).forEach(form => {
                        if (!state.interceptedForms.has(form)) {
                            interceptSingleForm(form);
                        }
                    });
                }, 100);
            }
            
            if (needsCartCheck) {
                setTimeout(updateCartQuantityControls, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        state.observerActive = true;
    }
    
    // ==================================================
    // INITIALIZATION
    // ==================================================
    
    async function init() {
        if (state.initialized) return;
        
        console.log('HALA: Initializing Advanced Quantity Limiter V6...');
        console.log('HALA: Configuration:', CONFIG);
        console.log('HALA: Locale:', LOCALE, 'Is Arabic:', IS_ARABIC);
        
        // Setup mini cart prevention
        preventMiniCartForLimitedProducts();
        
        try {
            // Load data
            await Promise.all([
                loadCollectionProducts(),
                fetchCartData(true)
            ]);
            
            // Enforce limits on current cart
            await enforceCartLimits();
            
            // Set up everything
            interceptForms();
            updateCartQuantityControls();
            interceptAjaxRequests();
            startDOMObserver();
            
            // Event listeners
            const events = ['cart:updated', 'cart:refresh', 'ajaxCart:updated', 'cart:success'];
            events.forEach(event => {
                document.addEventListener(event, async () => {
                    await fetchCartData(true);
                    setTimeout(async () => {
                        await enforceCartLimits();
                        updateCartQuantityControls();
                    }, 100);
                });
            });
            
            // Theme-specific events
            if (window.theme?.pubsub) {
                window.theme.pubsub.on('cart:updated', async () => {
                    await fetchCartData(true);
                    setTimeout(async () => {
                        await enforceCartLimits();
                        updateCartQuantityControls();
                    }, 100);
                });
            }
            
            // Periodic cart check
            setInterval(async () => {
                await fetchCartData(true);
                await enforceCartLimits();
            }, 3000);
            
            state.initialized = true;
            console.log('HALA: Initialization complete');
            
        } catch (error) {
            console.error('HALA: Initialization error:', error);
        }
    }
    
    // Navigation monitoring
    let lastPath = window.location.pathname;
    setInterval(() => {
        if (window.location.pathname !== lastPath) {
            lastPath = window.location.pathname;
            setTimeout(() => {
                // Re-intercept forms on navigation
                document.querySelectorAll(SELECTORS.productForms).forEach(form => {
                    if (!state.interceptedForms.has(form)) {
                        interceptSingleForm(form);
                    }
                });
                updateCartQuantityControls();
            }, 300);
        }
    }, 1000);
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Reinit on Shopify events
    document.addEventListener('shopify:section:load', () => {
        setTimeout(() => {
            document.querySelectorAll(SELECTORS.productForms).forEach(form => {
                if (!state.interceptedForms.has(form)) {
                    interceptSingleForm(form);
                }
            });
            updateCartQuantityControls();
        }, 300);
    });
    
    // Public API
    window.HalaQuantityLimiter = {
        init,
        reload: async () => {
            state.initialized = false;
            state.interceptedForms = new WeakSet();
            await init();
        },
        getConfig: () => CONFIG,
        getProductLimit: getProductLimit,
        showNotification,
        enforceCartLimits,
        debug: () => ({
            config: CONFIG,
            state: state,
            productLimits: Array.from(cache.productLimits.entries()),
            cartData: state.cartData,
            locale: LOCALE,
            isArabic: IS_ARABIC
        })
    };
    
})();