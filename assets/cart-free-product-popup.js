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
    
    /**
     * Check if cart meets threshold
     */
    async function checkCartThreshold() {
    if (state.isLoading || state.isActive || state.hasShownPopup) {
        return;
    }
    
    try {
        const cartData = await getCartData();
        state.currentCartTotal = cartData.total_price;
        
        // Check if user already has ANY free gift from the free-gifts-collection
        const hasFreeGift = cartData.items.some(item => 
            item.properties && (
                item.properties['_free_product'] === 'true' ||
                item.properties['_free_product'] === true
            )
        );
        
        if (hasFreeGift) {
            console.log('🎁 User already has a free gift, skipping popup');
            markAsCompleted(); // Prevent popup from showing again
            return;
        }
        
        console.log(`Cart total: ${cartData.total_price}, Threshold: ${CONFIG.cartThreshold}`);
        
        if (cartData.total_price >= CONFIG.cartThreshold) {
            console.log('🎉 Cart threshold reached! Showing free product popup...');
            showFreeProductPopup();
        }
    } catch (error) {
        console.error('Error checking cart threshold:', error);
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
        await addProductToCart(productData);
        
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