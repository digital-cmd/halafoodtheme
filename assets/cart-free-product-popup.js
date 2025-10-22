/**
 * Cart Free Product Popup Manager - Mobile-First Green Design
 * Optimized for cart pages only - High Performance
 * Version: 2.0.0
 */

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window._cartFreeProductInitialized) {
        return;
    }
    window._cartFreeProductInitialized = true;
    
    // Configuration with defaults
    const CONFIG = {
        cartThreshold: window.CART_FREE_PRODUCT_CONFIG?.cartThreshold || 5000, // 50 euros in cents
        maxFreeProducts: window.CART_FREE_PRODUCT_CONFIG?.maxFreeProducts || 1,
        collectionHandle: window.CART_FREE_PRODUCT_CONFIG?.collectionHandle || 'free-gifts-collection',
        checkInterval: 2000, // Check every 2 seconds
        debounceDelay: 500,
        sessionKey: 'cart_free_products_completed' // Only set when user completes or skips
    };
    
    // State management
    const state = {
        isActive: false,
        isInitialized: false,
        selectedProducts: new Set(),
        productData: new Map(),
        currentCartTotal: 0,
        hasShownPopup: false,
        isLoading: false,
        checkTimer: null,
        debounceTimer: null
    };
    
    // DOM Elements cache
    const elements = {
        overlay: null,
        modal: null,
        progressFill: null,
        progressText: null,
        addButton: null,
        skipButton: null,
        productsContainer: null,
        loadingContainer: null
    };
    
    /**
     * Initialize the free product system
     */
    function init() {
        if (state.isInitialized) return;
        
        console.log('🎁 Cart Free Product Manager initialized');
        
        // Check if user has completed free product selection in this session
        // Only blocks popup if user actually selected/skipped products
        state.hasShownPopup = sessionStorage.getItem(CONFIG.sessionKey) === 'true';
        
        // Setup cart monitoring
        setupCartMonitoring();
        
        // Initial cart check
        checkCartThreshold();
        
        state.isInitialized = true;
    }
    
    /**
     * Setup efficient cart monitoring for cart pages
     */
    function setupCartMonitoring() {
        // Listen for cart update events from existing theme
        document.addEventListener('cart:updated', handleCartUpdate);
        document.addEventListener('cart:update:count', handleCartUpdate);
        
        // Monitor cart form changes (for cart page)
        const cartForm = document.querySelector('form[action="/cart"]');
        if (cartForm) {
            cartForm.addEventListener('change', debounceCartCheck);
            cartForm.addEventListener('submit', () => {
                setTimeout(checkCartThreshold, 1000);
            });
        }
        
        // Monitor quantity changes
        document.addEventListener('change', function(e) {
            if (e.target.matches('input[name*="quantity"], input[data-quantity-value]')) {
                debounceCartCheck();
            }
        });
        
        // Monitor cart AJAX requests
        interceptCartRequests();
        
        // Periodic check as fallback
        state.checkTimer = setInterval(checkCartThreshold, CONFIG.checkInterval);

        document.addEventListener('click', function(e) {
    if (e.target.closest('[data-open-drawer="mini_cart"], [data-cart-toggle], .t4s-pr-item-cart')) {
        setTimeout(checkCartThreshold, 500);
    }
});
    }
    
    /**
     * Debounced cart check for performance
     */
    function debounceCartCheck() {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = setTimeout(checkCartThreshold, CONFIG.debounceDelay);
    }
    
    /**
     * Handle cart update events
     */
    function handleCartUpdate(event) {
        console.log('🛒 Cart updated, checking threshold...');
        debounceCartCheck();
    }
    
    /**
     * Intercept cart AJAX requests
     */
    function interceptCartRequests() {
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const [url] = args;
            if (url && (url.includes('/cart/add') || url.includes('/cart/change') || url.includes('/cart/update'))) {
                return originalFetch.apply(this, args).then(response => {
                    setTimeout(checkCartThreshold, 500);
                    return response;
                });
            }
            return originalFetch.apply(this, args);
        };
    }
    
async function checkCartThreshold() {
    if (state.isLoading || state.isActive) {
        return;
    }
    
    try {
        const cartData = await getCartData();
        state.currentCartTotal = cartData.total_price;
        
        // ONLY check for _free_product, IGNORE _free_sample
        const hasFreeProduct = cartData.items.some(item => {
            if (!item.properties) return false;
            
            // ONLY look for _free_product, not _free_sample
            return item.properties['_free_product'] === 'true' || 
                   item.properties['_free_product'] === true;
            // NOT checking for _free_sample - that's a different system
        });
        
        if (hasFreeProduct) {
            console.log('🎁 User already has free PRODUCT from popup');
            return;
        }
        
        // Check if only has free sample (this is OK, can still get free product)
        const hasFreeSample = cartData.items.some(item => 
            item.properties && (
                item.properties['_free_sample'] === 'true' ||
                item.properties['_free_sample'] === true
            )
        );
        
        if (hasFreeSample) {
            console.log('📦 Has free sample (€20 gift) but can still get free product (€50 gift)');
        }
        
        console.log(`Cart: €${(cartData.total_price/100).toFixed(2)}, Threshold: €50`);
        
        if (cartData.total_price >= CONFIG.cartThreshold && !state.hasShownPopup) {
            console.log('🎉 Eligible for free product popup!');
            showFreeProductPopup();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
    
    /**
     * Get cart data efficiently
     */
    async function getCartData() {
        // Try to get from existing cart object first (faster)
        if (window.cart || window.Shopify?.cart) {
            const cart = window.cart || window.Shopify.cart;
            if (cart.total_price !== undefined) {
                return cart;
            }
        }
        
        // Fallback to fetch
        const response = await fetch('/cart.js');
        if (!response.ok) {
            throw new Error('Failed to fetch cart data');
        }
        return await response.json();
    }
    
    /**
     * Show the free product popup
     */
// Add this complete fix to your cart-free-product-popup.js file
// Replace the showFreeProductPopup function with this version:

function showFreeProductPopup() {
    console.log('📦 Attempting to show popup...');
    console.log('State check - isActive:', state.isActive, 'hasShownPopup:', state.hasShownPopup);
    
    if (state.isActive || state.hasShownPopup) {
        console.log('Popup blocked - already active or shown');
        return;
    }
    
    state.isActive = true;
    
    try {
        // Create the popup
        createPopupModal();
        
        if (!elements.overlay) {
            console.error('❌ Failed to create overlay element');
            state.isActive = false;
            return;
        }
        
        console.log('✅ Overlay created successfully');
        
        // Add body class
        document.body.classList.add('cart-free-popup-active');
        
        // CRITICAL FIX: Force the popup to be visible with inline styles
        elements.overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(8px) !important;
            z-index: 999999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 0;
            visibility: visible !important;
            transition: opacity 0.4s ease !important;
        `;
        
        // Force body overflow hidden
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'relative';
        
        // Force a reflow
        void elements.overlay.offsetHeight;
        
        // Animate in
        setTimeout(() => {
            if (elements.overlay) {
                elements.overlay.style.opacity = '1';
                elements.overlay.classList.add('active');
                console.log('✅ Popup should be visible now');
                
                // Double-check visibility
                const isVisible = window.getComputedStyle(elements.overlay).display !== 'none' 
                    && window.getComputedStyle(elements.overlay).visibility !== 'hidden'
                    && window.getComputedStyle(elements.overlay).opacity !== '0';
                    
                if (!isVisible) {
                    console.error('❌ Popup still not visible, forcing display');
                    elements.overlay.style.display = 'flex !important';
                    elements.overlay.style.opacity = '1 !important';
                    elements.overlay.style.visibility = 'visible !important';
                }
            }
        }, 10);
        
        // Load products after a slight delay to ensure popup is visible
        setTimeout(() => {
            loadFreeProducts();
        }, 100);
        
    } catch (error) {
        console.error('❌ Error showing popup:', error);
        state.isActive = false;
    }
}


// Also update the createPopupModal function to be more robust
function createPopupModal() {
    console.log('🔨 Creating popup modal...');
    
    // Remove any existing popups first
    const existing = document.querySelector('.cart-free-popup-overlay');
    if (existing) {
        console.log('Removing existing popup...');
        existing.remove();
    }
    
    // Create overlay
    elements.overlay = document.createElement('div');
    elements.overlay.className = 'cart-free-popup-overlay';
    
    // Get translations
    const translations = window.CART_FREE_PRODUCT_CONFIG?.translations || {};
    const maxProducts = window.CART_FREE_PRODUCT_CONFIG?.maxFreeProducts || 1;
    
    // Set inner HTML
    elements.overlay.innerHTML = `
        <div class="cart-free-popup-modal">
            <div class="cart-free-popup-header">
                <div class="cart-free-popup-title">
                    🎁 ${translations.title || 'Choose ' + maxProducts + ' FREE Products'}
                </div>
                <div class="cart-free-popup-subtitle">
                    ${translations.subtitle || 'Select any ' + maxProducts + ' items below - completely free!'}
                </div>
                <div class="cart-free-progress-container">
                    <div class="cart-free-progress-fill"></div>
                    <div class="cart-free-progress-text">
                        <span class="selected-count">0</span> / ${maxProducts} ${translations.selected || 'selected'}
                    </div>
                </div>
                <div class="cart-free-actions">
                    <button class="cart-free-add-btn" disabled>
                        ${translations.add_button || 'Add FREE Products'}
                    </button>
                    <button class="cart-free-skip-btn">
                        ${translations.skip_button || 'Skip'}
                    </button>
                </div>
            </div>
            <div class="cart-free-products-section">
                <div class="cart-free-loading">
                    <div class="cart-free-loading-spinner"></div>
                    <div class="cart-free-loading-text">${translations.loading || 'Loading free products...'}</div>
                </div>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(elements.overlay);
    console.log('✅ Overlay appended to body');
    
    // Cache DOM elements
    cacheElements();
    
    // Setup event listeners
    setupEventListeners();
}
    
    /**
     * Get popup HTML template using passed translations
     */
    function getPopupHTML() {
        const translations = window.CART_FREE_PRODUCT_CONFIG?.translations || {};
        
        return `
            <div class="cart-free-popup-modal">
                <div class="cart-free-popup-header">
                    <div class="cart-free-popup-title">
                        🎁 ${translations.title || `Choose ${CONFIG.maxFreeProducts} FREE Products`}
                    </div>
                    <div class="cart-free-popup-subtitle">
                        ${translations.subtitle || `Select any ${CONFIG.maxFreeProducts} items below - completely free!`}
                    </div>
                    <div class="cart-free-progress-container">
                        <div class="cart-free-progress-fill"></div>
                        <div class="cart-free-progress-text">
                            <span class="selected-count">0</span> / ${CONFIG.maxFreeProducts} ${translations.selected || 'selected'}
                        </div>
                    </div>
                    <div class="cart-free-actions">
                        <button class="cart-free-add-btn" disabled>
                            ${translations.add_button || 'Add FREE Products'}
                        </button>
                        <button class="cart-free-skip-btn">
                            ${translations.skip_button || 'Skip'}
                        </button>
                    </div>
                </div>
                <div class="cart-free-products-section">
                    <div class="cart-free-loading">
                        <div class="cart-free-loading-spinner"></div>
                        <div class="cart-free-loading-text">${translations.loading || 'Loading free products...'}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Cache DOM elements for performance
     */
    function cacheElements() {
        elements.modal = elements.overlay.querySelector('.cart-free-popup-modal');
        elements.progressFill = elements.overlay.querySelector('.cart-free-progress-fill');
        elements.progressText = elements.overlay.querySelector('.selected-count');
        elements.addButton = elements.overlay.querySelector('.cart-free-add-btn');
        elements.skipButton = elements.overlay.querySelector('.cart-free-skip-btn');
        elements.productsContainer = elements.overlay.querySelector('.cart-free-products-section');
        elements.loadingContainer = elements.overlay.querySelector('.cart-free-loading');
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Add to cart button
        elements.addButton.addEventListener('click', addSelectedProducts);
        
        // Skip button
        elements.skipButton.addEventListener('click', function() {
            // Mark as completed when user explicitly skips
            markAsCompleted();
            closePopup();
        });
        
        // Close on overlay click
        elements.overlay.addEventListener('click', function(e) {
            if (e.target === elements.overlay) {
                closePopup();
            }
        });
        
        // ESC key to close
        document.addEventListener('keydown', handleKeyPress);
    }
    
    /**
     * Handle keyboard events
     */
    function handleKeyPress(e) {
        if (e.key === 'Escape' && state.isActive) {
            closePopup();
        }
    }
    
async function loadFreeProducts() {
    console.log('📦 Loading free products...');
    
    if (!elements.productsContainer) {
        console.error('❌ Products container not found');
        return;
    }
    
    try {
        state.isLoading = true;
        
        // Show loading state
        elements.productsContainer.innerHTML = `
            <div class="cart-free-loading">
                <div class="cart-free-loading-spinner"></div>
                <div class="cart-free-loading-text">${getTranslation('loading', 'Loading free products...')}</div>
            </div>
        `;
        
        console.log('🔍 Fetching products from collection:', CONFIG.collectionHandle);
        
        // Fetch products from collection
        const response = await fetch(`/collections/${CONFIG.collectionHandle}/products.json?limit=12`);
        
        if (!response.ok) {
            console.error('❌ Failed to fetch products:', response.status);
            showErrorState();
            return;
        }
        
        const data = await response.json();
        console.log('✅ Products loaded:', data.products?.length || 0, 'products');
        
        if (!data.products || data.products.length === 0) {
            showEmptyState();
            return;
        }
        
        // Render products
        renderProducts(data.products);
        
    } catch (error) {
        console.error('❌ Error loading products:', error);
        showErrorState();
    } finally {
        state.isLoading = false;
    }
}

// Add this helper function to check popup visibility
function debugPopupVisibility() {
    const overlay = document.querySelector('.cart-free-popup-overlay');
    if (overlay) {
        const styles = window.getComputedStyle(overlay);
        console.log('Popup visibility debug:', {
            exists: true,
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            zIndex: styles.zIndex,
            position: styles.position,
            classList: overlay.className
        });
        
        // Check if any parent elements are hiding it
        let parent = overlay.parentElement;
        while (parent && parent !== document.body) {
            const parentStyles = window.getComputedStyle(parent);
            if (parentStyles.display === 'none' || parentStyles.visibility === 'hidden') {
                console.warn('Parent element is hiding the popup:', parent);
            }
            parent = parent.parentElement;
        }
    } else {
        console.log('Popup overlay not found in DOM');
    }
}
    
    /**
     * Render products using Shopify API data
     */
    function renderProducts(products) {
        const productsHTML = products.map((product, index) => {
            const productData = extractProductDataFromAPI(product);
            if (productData) {
                state.productData.set(index, productData);
                return createProductCard(productData, index);
            }
            return '';
        }).filter(html => html !== '').join('');
        
        const gridHTML = `
            <div class="cart-free-products-grid">
                ${productsHTML}
            </div>
        `;
        
        elements.productsContainer.innerHTML = gridHTML;
        
        // Setup product selection events
        setupProductSelection();
        
        // Initialize lazy loading for images
        initializeLazyLoading();
    }
    
    /**
     * Extract product data from Shopify API response
     */
    function extractProductDataFromAPI(product) {
        try {
            const featuredImage = product.featured_image || product.images?.[0];
            let imageData = null;
            
            if (featuredImage) {
                // Ensure proper Shopify CDN URL
                let imageSrc = featuredImage;
                if (typeof featuredImage === 'object') {
                    imageSrc = featuredImage.src || featuredImage.url;
                }
                
                // Add proper width parameter for Shopify CDN
                if (imageSrc && imageSrc.includes('cdn.shopify.com')) {
                    const url = new URL(imageSrc);
                    url.searchParams.set('width', '300');
                    imageSrc = url.toString();
                }
                
                imageData = {
                    src: imageSrc,
                    alt: product.title,
                    width: '300',
                    height: '300'
                };
            }
            
            return {
                handle: product.handle,
                title: product.title,
                url: `/products/${product.handle}`,
                image: imageData
            };
        } catch (error) {
            console.error('Error extracting product data from API:', error);
            return null;
        }
    }
    
    /**
     * Extract product data from element
     */
    function extractProductDataFromElement(productElement) {
        try {
            const titleEl = productElement.querySelector('.t4s-product-title, .product-title, h3, h2, a[href*="/products/"]');
            const linkEl = productElement.querySelector('a[href*="/products/"]');
            const imageEl = productElement.querySelector('img');
            
            if (!linkEl) return null;
            
            const productUrl = linkEl.getAttribute('href');
            const productHandle = productUrl.split('/products/')[1]?.split('?')[0];
            const title = titleEl ? titleEl.textContent.trim() : 'Product';
            
            // Extract image data - Handle multiple possible sources
            let imageData = null;
            if (imageEl) {
                let imageSrc = imageEl.getAttribute('data-src') || 
                              imageEl.getAttribute('src') || 
                              imageEl.getAttribute('data-master');
                
                // If data-srcset exists, extract first URL
                if (!imageSrc || imageSrc.includes('data:image/gif')) {
                    const srcset = imageEl.getAttribute('data-srcset');
                    if (srcset) {
                        imageSrc = srcset.split(',')[0]?.split(' ')[0];
                    }
                }
                
                // Clean up image URL and ensure it's not a placeholder
                if (imageSrc && 
                    imageSrc !== 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' &&
                    !imageSrc.includes('placeholder')) {
                    
                    // Convert relative URLs to absolute if needed
                    if (imageSrc.startsWith('//')) {
                        imageSrc = 'https:' + imageSrc;
                    } else if (imageSrc.startsWith('/')) {
                        imageSrc = window.location.origin + imageSrc;
                    }
                    
                    // Ensure we have a proper Shopify CDN URL with width parameter
                    if (imageSrc.includes('cdn.shopify.com')) {
                        // Add or modify width parameter for proper sizing
                        if (imageSrc.includes('?')) {
                            if (!imageSrc.includes('width=')) {
                                imageSrc += '&width=300';
                            }
                        } else {
                            imageSrc += '?width=300';
                        }
                    }
                    
                    imageData = {
                        src: imageSrc,
                        alt: imageEl.getAttribute('alt') || title,
                        width: imageEl.getAttribute('width') || '300',
                        height: imageEl.getAttribute('height') || '300'
                    };
                }
            }
            
            return {
                handle: productHandle,
                title: title,
                url: productUrl,
                image: imageData
            };
        } catch (error) {
            console.error('Error extracting product data:', error);
            return null;
        }
    }
    
    /**
     * Create product card HTML - Using Theme's Image System
     */
    function createProductCard(productData, index) {
        const imageHTML = productData.image ? `
            <div class="cart-free-product-image">
                <div class="t4s-pr t4s-oh t4s_ratio" style="--aspect-ratioapt: 1">
                    <img class="lazyloadt4s" 
                         data-src="${productData.image.src}" 
                         data-widths="[160,320,480]" 
                         data-sizes="auto"
                         width="300" 
                         height="300" 
                         alt="${productData.image.alt}"
                         src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">
                    <span class="lazyloadt4s-loader is-bg-img" style="background: url(${productData.image.src});"></span>
                </div>
            </div>
        ` : `
            <div class="cart-free-product-image">
                <div class="t4s-pr t4s-oh t4s_ratio" style="--aspect-ratioapt: 1; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">
                    No Image
                </div>
            </div>
        `;
        
        return `
            <div class="cart-free-product" data-product-index="${index}">
                ${imageHTML}
                <div class="cart-free-product-info">
                    <h3 class="cart-free-product-title t4s-d-block t4s-truncate">${productData.title}</h3>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup product selection
     */
    function setupProductSelection() {
        const productElements = elements.productsContainer.querySelectorAll('.cart-free-product');
        
        productElements.forEach((productEl) => {
            productEl.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(this.getAttribute('data-product-index'));
                toggleProductSelection(index);
            });
        });
    }
    
    /**
     * Initialize lazy loading for images
     */
    function initializeLazyLoading() {
        // Use the theme's lazy loading system if available
        if (window.T4SThemeSP && window.T4SThemeSP.lazyLoad) {
            window.T4SThemeSP.lazyLoad();
        } else if (window.lazySizes) {
            window.lazySizes.init();
        } else {
            // Fallback: simple lazy loading
            const images = elements.productsContainer.querySelectorAll('img[data-src]');
            images.forEach(img => {
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.classList.add('lazyloadt4sed');
                }
            });
        }
    }
    
    /**
     * Get multilingual text from passed translations
     */
    function getTranslation(key, defaultText = '') {
        const translations = window.CART_FREE_PRODUCT_CONFIG?.translations || {};
        return translations[key] || defaultText;
    }
    
    /**
     * Toggle product selection
     */
    function toggleProductSelection(index) {
        const productEl = elements.productsContainer.querySelector(`[data-product-index="${index}"]`);
        const isSelected = state.selectedProducts.has(index);
        
        if (isSelected) {
            // Deselect
            state.selectedProducts.delete(index);
            productEl.classList.remove('selected');
        } else {
            // Check selection limit
            if (state.selectedProducts.size >= CONFIG.maxFreeProducts) {
                const message = getTranslation('limit_reached', `You can only select ${CONFIG.maxFreeProducts} free products!`);
                showNotification(message, 'warning');
                return;
            }
            
            // Select
            state.selectedProducts.add(index);
            productEl.classList.add('selected');
        }
        
        updateProgress();
        updateAddButton();
    }
    
    /**
     * Update progress bar
     */
    function updateProgress() {
        const selectedCount = state.selectedProducts.size;
        const percentage = (selectedCount / CONFIG.maxFreeProducts) * 100;
        
        elements.progressFill.style.width = `${percentage}%`;
        elements.progressText.textContent = selectedCount;
    }
    
    /**
     * Update add button state
     */
    function updateAddButton() {
        const isComplete = state.selectedProducts.size === CONFIG.maxFreeProducts;
        
        elements.addButton.disabled = !isComplete;
        elements.addButton.classList.toggle('active', isComplete);
    }
    
    /**
     * Add selected products to cart
     */
    async function addSelectedProducts() {
    if (state.selectedProducts.size !== CONFIG.maxFreeProducts) {
        return;
    }
    
    // Check one more time if user already has a free gift
    try {
        const cartData = await getCartData();
        const hasFreeGift = cartData.items.some(item => 
            item.properties && (
                item.properties['_free_product'] === 'true' ||
                item.properties['_free_product'] === true
            )
        );
        
        if (hasFreeGift) {
            showNotification('You already have a free gift in your cart!', 'warning');
            markAsCompleted();
            closePopup();
            return;
        }
    } catch (error) {
        console.error('Error checking cart before adding:', error);
    }
    
    // Update button state
    elements.addButton.innerHTML = `
        <div class="cart-free-loading-spinner" style="width: 16px; height: 16px; margin-right: 8px; display: inline-block;"></div>
        ${getTranslation('adding', 'Adding...')}
    `;
    elements.addButton.disabled = true;
    
    try {
        const selectedData = Array.from(state.selectedProducts).map(index => 
            state.productData.get(index)
        );
        
// Add products to cart - but only add the first one to enforce collection limit
const productData = selectedData[0]; // Only add 1 product from collection
const result = await addProductToCart(productData);  // CHANGE: Store the result

// FIX #3: ADD THESE LINES HERE - TRIGGER GIFT NOTIFICATION
const giftName = result.title || result.product_title || productData.title;
if (window.showFreeGiftNotification) {
    console.log('Notification function exists?', typeof window.showFreeGiftNotification);
    window.showFreeGiftNotification(giftName);
    console.log('✅ Gift notification triggered');
}

showNotification(getTranslation('success', 'Free product added to cart! 🎉'), 'success');
        
        // Mark as completed when products are successfully added
        markAsCompleted();
        
        // Close popup after success
        setTimeout(() => {
            closePopup();
            // Refresh cart data
            if (window.location.reload) {
                window.location.reload();
            }
        }, 1500);
        
    } catch (error) {
        console.error('Error adding products:', error);
        showNotification(getTranslation('error', 'Error adding product. Please try again.'), 'error');
        
        // Reset button
        elements.addButton.innerHTML = getTranslation('add_button', 'Add FREE Products');
        elements.addButton.disabled = false;
    }
}

    /**
     * Add single product to cart
     */
    async function addProductToCart(productData) {
        // Get product variants
        const productResponse = await fetch(`/products/${productData.handle}.js`);
        if (!productResponse.ok) {
            throw new Error(`Failed to fetch product: ${productData.handle}`);
        }
        
        const product = await productResponse.json();
        
        if (!product.variants || product.variants.length === 0) {
            throw new Error(`No variants for product: ${productData.handle}`);
        }
        
        // Find available variant
        const availableVariant = product.variants.find(variant => variant.available);
        if (!availableVariant) {
            throw new Error(`No available variants for: ${productData.handle}`);
        }
        
        // Add to cart
        const cartData = {
            id: availableVariant.id,
            quantity: 1,
            properties: {
                '_free_product': 'true',
                '_free_offer_cart_threshold': CONFIG.cartThreshold,
                '_free_offer_date': new Date().toISOString()
            }
        };
        
        const response = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cartData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.description || `Failed to add ${productData.title}`);
        }
        
        return await response.json();
    }
    
    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.cart-free-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `cart-free-notification cart-free-notification--${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }
    
    /**
     * Show empty state
     */
    function showEmptyState() {
        elements.productsContainer.innerHTML = `
            <div class="cart-free-empty-state">
                <h3>${getTranslation('empty_title', 'No Free Products Available')}</h3>
                <p>${getTranslation('empty_message', 'Sorry, there are currently no free products available for selection.')}</p>
                <button class="cart-free-close-btn" onclick="window.cartFreePopup.close()">${getTranslation('close', 'Close')}</button>
            </div>
        `;
    }
    
    /**
     * Show error state
     */
    function showErrorState() {
        elements.productsContainer.innerHTML = `
            <div class="cart-free-error-state">
                <h3>${getTranslation('error_title', 'Error Loading Products')}</h3>
                <p>${getTranslation('error_message', 'There was an error loading the free products. Please try again later.')}</p>
                <button class="cart-free-close-btn" onclick="window.cartFreePopup.close()">${getTranslation('close', 'Close')}</button>
            </div>
        `;
    }
    
    /**
     * Mark free product selection as completed
     */
    function markAsCompleted() {
        state.hasShownPopup = true;
        sessionStorage.setItem(CONFIG.sessionKey, 'true');
        console.log('🎁 Free product selection marked as completed');
    }
    
    /**
     * Close popup
     */
    function closePopup() {
        if (!elements.overlay) return;
        
        elements.overlay.classList.remove('active');
        
        setTimeout(() => {
            if (elements.overlay && elements.overlay.parentNode) {
                elements.overlay.remove();
            }
            
            document.body.classList.remove('cart-free-popup-active');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyPress);
            
            // Reset state
            state.isActive = false;
            state.selectedProducts.clear();
            state.productData.clear();
            
            // Clear references
            Object.keys(elements).forEach(key => {
                elements[key] = null;
            });
        }, 400);
    }
    
    /**
     * Cleanup function
     */
    function cleanup() {
        if (state.checkTimer) {
            clearInterval(state.checkTimer);
        }
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
        }
        closePopup();
    }
    
    // Public API
    window.cartFreePopup = {
        init,
        show: showFreeProductPopup,
        close: closePopup,
        config: CONFIG,
        state: state
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
})();

(function() {
  'use strict';
  
  // Configuration
  const NOTIFICATION_DURATION = 4000; // Slightly longer for free gifts
  const NOTIFICATION_ID = 'free-gift-notification-popup';
  
  // Create notification HTML for free gift
  function createFreeGiftNotificationHTML() {
    // Check if already exists
    if (document.getElementById(NOTIFICATION_ID)) return;
    
    const notificationHTML = `
      <div id="${NOTIFICATION_ID}" class="free-gift-notification-popup">
        <div class="notification-content">
          <svg class="gift-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" stroke-width="2"/>
            <path d="M3 8h18v4H3z" fill="currentColor" opacity="0.2"/>
            <rect x="10" y="3" width="4" height="18" fill="currentColor"/>
            <path d="M7 3h10l-2 5H9L7 3z" fill="currentColor"/>
            <circle cx="12" cy="5" r="1" fill="white"/>
          </svg>
          <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <p class="notification-text" 
             data-text-en="🎁 Your free gift was added successfully!" 
             data-text-ar="🎁 تمت إضافة هديتك المجانية بنجاح!" 
             data-text-de="🎁 Ihr kostenloses Geschenk wurde erfolgreich hinzugefügt!"
            🎁 Your free gift was added successfully!
          </p>
          <p class="notification-subtext"
             data-text-en="Check your cart to see your gift"
             data-text-ar="تحقق من سلتك لرؤية هديتك"
             data-text-de="Überprüfen Sie Ihren Warenkorb für Ihr Geschenk"
            Check your cart to see your gift
          </p>
        </div>
      </div>
    `;
    
    // Add CSS if not already present
    if (!document.getElementById('free-gift-notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'free-gift-notification-styles';
      styles.textContent = `
        /* Free Gift Notification Styles */
        .free-gift-notification-popup {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          border: 2px solid #4CAF50;
          border-radius: 16px;
          padding: 35px 45px;
          box-shadow: 0 15px 40px rgba(76, 175, 80, 0.3);
          z-index: 9999999;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          text-align: center;
          min-width: 320px;
          max-width: 90%;
          pointer-events: none;
        }
        
        .free-gift-notification-popup.show {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
          pointer-events: auto;
        }
        
        .free-gift-notification-popup .notification-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        /* Gift Icon Animation */
        .free-gift-notification-popup .gift-icon {
          width: 50px;
          height: 50px;
          color: #4CAF50;
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          animation: giftBounce 0.6s 0.2s forwards;
        }
        
        @keyframes giftBounce {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) translateY(5px) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        /* Checkmark Animation */
        .free-gift-notification-popup .checkmark {
          width: 52px;
          height: 52px;
          margin-top: 40px;
        }
        
        .free-gift-notification-popup .checkmark-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #4CAF50;
          fill: none;
          animation: strokeCircle 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        
        .free-gift-notification-popup .checkmark-check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          stroke-width: 3;
          stroke: #4CAF50;
          animation: strokeCheck 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        @keyframes strokeCircle {
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes strokeCheck {
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        /* Text Styling */
        .free-gift-notification-popup .notification-text {
          margin: 10px 0 5px;
          font-size: 18px;
          color: #2e7d32;
          font-weight: 600;
          line-height: 1.5;
          font-family: inherit;
          animation: fadeInUp 0.5s 0.9s forwards;
          opacity: 0;
        }
        
        .free-gift-notification-popup .notification-subtext {
          margin: 0;
          font-size: 14px;
          color: #666;
          font-weight: 400;
          line-height: 1.4;
          font-family: inherit;
          animation: fadeInUp 0.5s 1s forwards;
          opacity: 0;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Sparkle Effect */
        .free-gift-notification-popup::before,
        .free-gift-notification-popup::after {
          content: '✨';
          position: absolute;
          font-size: 20px;
          animation: sparkle 1.5s linear infinite;
        }
        
        .free-gift-notification-popup::before {
          top: 15px;
          left: 20px;
          animation-delay: 0s;
        }
        
        .free-gift-notification-popup::after {
          top: 15px;
          right: 20px;
          animation-delay: 0.75s;
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        
        /* Mobile Responsiveness */
        @media (max-width: 480px) {
          .free-gift-notification-popup {
            padding: 25px 30px;
            min-width: 280px;
          }
          
          .free-gift-notification-popup .notification-text {
            font-size: 16px;
          }
          
          .free-gift-notification-popup .notification-subtext {
            font-size: 13px;
          }
          
          .free-gift-notification-popup .gift-icon {
            width: 40px;
            height: 40px;
          }
        }
        
        /* Dark mode support */
        [data-theme="dark"] .free-gift-notification-popup {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border-color: #66BB6A;
          box-shadow: 0 15px 40px rgba(102, 187, 106, 0.4);
        }
        
        [data-theme="dark"] .free-gift-notification-popup .notification-text {
          color: #66BB6A;
        }
        
        [data-theme="dark"] .free-gift-notification-popup .notification-subtext {
          color: #aaa;
        }
      `;
      document.head.appendChild(styles);
    }
    
    const div = document.createElement('div');
    div.innerHTML = notificationHTML;
    document.body.appendChild(div.firstElementChild);
  }
  
  // Get current language
  function getCurrentLanguage() {
    const lang = document.documentElement.lang || 
                 document.querySelector('html').getAttribute('lang') || 
                 window.Shopify?.locale || 
                 window.theme?.language ||
                 'en';
    return lang.toLowerCase().substring(0, 2);
  }
  
  // Show free gift notification
  function showFreeGiftNotification(giftName = null) {
    const popup = document.getElementById(NOTIFICATION_ID);
    if (!popup) {
      createFreeGiftNotificationHTML();
      return showFreeGiftNotification(giftName);
    }
    
    const textElement = popup.querySelector('.notification-text');
    const subtextElement = popup.querySelector('.notification-subtext');
    const currentLang = getCurrentLanguage();
    
    // Set localized text
    const textKey = `data-text-${currentLang}`;
    let localizedText = textElement.getAttribute(textKey) || 
                       textElement.getAttribute('data-text-en');
    
    // If gift name is provided, customize the message
    if (giftName) {
      const customMessages = {
        'en': `🎁 "${giftName}" was added as your free gift!`,
        'ar': `🎁 تمت إضافة "${giftName}" كهدية مجانية!`,
        'de': `🎁 "${giftName}" wurde als Ihr kostenloses Geschenk hinzugefügt!`,
      };
      localizedText = customMessages[currentLang] || customMessages['en'];
    }
    
    textElement.textContent = localizedText;
    
    // Set localized subtext
    const subtextKey = `data-text-${currentLang}`;
    const localizedSubtext = subtextElement.getAttribute(subtextKey) || 
                            subtextElement.getAttribute('data-text-en');
    subtextElement.textContent = localizedSubtext;
    
    // Reset animations
    const checkmarkCircle = popup.querySelector('.checkmark-circle');
    const checkmarkCheck = popup.querySelector('.checkmark-check');
    const giftIcon = popup.querySelector('.gift-icon');
    
    // Reset all animations
    [checkmarkCircle, checkmarkCheck, giftIcon, textElement, subtextElement].forEach(el => {
      if (el) {
        el.style.animation = 'none';
        el.offsetHeight; // Force reflow
        el.style.animation = '';
      }
    });
    
    // Show popup
    popup.classList.add('show');
    
    // Play a subtle sound effect if available
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBz');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (e) {}
    
    // Hide after duration
    setTimeout(() => {
      popup.classList.remove('show');
    }, NOTIFICATION_DURATION);
  }
  
  // Listen for free gift events
  function listenForFreeGiftEvents() {
    // Listen for custom events
    ['free-gift:added', 'freeGift:added', 'cart:free-product-added'].forEach(eventName => {
      document.addEventListener(eventName, function(e) {
        const giftName = e.detail?.productTitle || e.detail?.title || null;
        showFreeGiftNotification(giftName);
      });
    });
    

  }
  
  // Initialize
  function init() {
    createFreeGiftNotificationHTML();
    listenForFreeGiftEvents();
    
    // Expose global function for testing
    window.showFreeGiftNotification = showFreeGiftNotification;
    
    console.log('✅ Free gift notification system initialized');
    console.log('💡 Test with: showFreeGiftNotification("Test Product Name")');
  }
  
  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Debug helper - ADD THIS AT END OF FILE
window.resetFreeProductPopup = function() {
    sessionStorage.removeItem('cart_free_products_completed');
    if (window.cartFreePopup) {
        window.cartFreePopup.state.hasShownPopup = false;
        window.cartFreePopup.state.isActive = false;
    }
    console.log('✅ Popup reset');
};
})();