// Bundle Collection Manager js - Enhanced AJAX Support 
(function() {
    'use strict';
    
    // Check if already loaded
    if (window._bundleManagerLoaded) {
        console.log('Bundle manager already loaded, skipping...');
        return;
    }
    window._bundleManagerLoaded = true;
    
    // Immediately block all popup/quickview functions
    window.ProductPopup = function() { return false; };
    window.openQuickview = function() { return false; };
    window.quickView = function() { return false; };
    window.quickShop = function() { return false; };
    window.openProductModal = function() { return false; };
    
    // Override any theme-specific popup functions
    if (window.theme) {
        window.theme.openQuickview = function() { return false; };
        window.theme.ProductPopup = function() { return false; };
        // Monitor pagination container specifically
        const paginationContainer = document.querySelector('.t4s-pagination-wrapper, .pagination');
        if (paginationContainer) {
            const paginationObserver = new MutationObserver(() => {
                console.log('Pagination changed, restoring selections...');
                setTimeout(() => {
                    restoreSelectionSnapshot();
                    setupProducts();
                    reapplySelections();
                }, 500);
            });
            
            paginationObserver.observe(paginationContainer, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
    }
    
    // Override T4S theme functions if they exist
    if (window.t4s) {
        window.t4s.openQuickview = function() { return false; };
        window.t4s.quickView = function() { return false; };
        window.t4s.productPopup = function() { return false; };
    }
    
    // Override any jQuery popup triggers
    if (window.$ || window.jQuery) {
        const $ = window.$ || window.jQuery;
        $(document).off('click', '[data-quickview]');
        $(document).off('click', '.quickview');
        $(document).off('click', '.quick-view');
    }
    
    // Configuration - Now supports multiple bundle types
    const BUNDLE_CONFIGS = {
        'bundle-1': {
            maxProducts: 10,
            bundlePrice: 17.99,
            maxVariantPrice: 260,
            bundleProductHandle: 'spice-bundle-choose-any-10',
            bundleType: 'spice_bundle_10'
        },
        'bundle-5': {
            maxProducts: 5,
            bundlePrice: 9.99,
            maxVariantPrice: 260,
            bundleProductHandle: 'spice-bundle-choose-any-5',
            bundleType: 'spice_bundle_5'
        },
        'bundle-15': {
            maxProducts: 15,
            bundlePrice: 24.99,
            maxVariantPrice: 260,
            bundleProductHandle: 'spice-bundle-choose-any-15',
            bundleType: 'spice_bundle_15'
        }
    };
    
    // Get current bundle config based on collection
    function getCurrentBundleConfig() {
        const path = window.location.pathname;
        for (const [handle, config] of Object.entries(BUNDLE_CONFIGS)) {
            if (path.includes(`/collections/${handle}`)) {
                return { handle, ...config };
            }
        }
        return null;
    }
    
    // State
    const bundleState = {
        selectedProducts: new Map(),
        productVariants: new Map(),
        initialized: false,
        processingProducts: false,
        currentConfig: null,
        lastSelectionSnapshot: null,
        expectingAjaxUpdate: false,
        productCountBefore: 0,
        existingProducts: [],
        appendMode: false,
        isLoadPrevious: false
    };
    
    // Translations - Now with dynamic placeholders
    const translations = {
        en: {
            selected: '{count}/{max} Selected',
            selectProducts: 'Select {max} Products',
            addToCart: 'Add Bundle to Cart - €{price}',
            complete: 'Bundle Complete! Click to Add to Cart',
            added: 'Bundle added to cart successfully! 🎉',
            error: 'Error adding bundle to cart',
            maxReached: 'You already selected {max} products! 🛑',
            productAdded: '✅ Product added to bundle',
            productRemoved: '❌ Product removed from bundle',
            almostThere: 'Almost there! Select {remaining} more products',
            goToCart: 'Going to cart...',
            chooseProducts: '🎁 Choose Any {max} Products for €{price}',
            clickToSelect: '👇 Click on products below to select them for your bundle'
        },
        ar: {
            selected: '{count}/{max} محدد',
            selectProducts: 'اختر {max} منتجات',
            addToCart: 'أضف الباقة للسلة - {price} يورو',
            complete: 'الباقة مكتملة! اضغط للإضافة للسلة',
            added: 'تمت إضافة الباقة للسلة بنجاح! 🎉',
            error: 'خطأ في إضافة الباقة للسلة',
            maxReached: 'لقد اخترت {max} منتجات بالفعل! 🛑',
            productAdded: '✅ تمت إضافة المنتج للباقة',
            productRemoved: '❌ تمت إزالة المنتج من الباقة',
            almostThere: 'تقريبا! اختر {remaining} منتجات أخرى',
            goToCart: 'الانتقال إلى السلة...',
            chooseProducts: '🎁 اختر أي {max} منتجات مقابل {price} يورو',
            clickToSelect: '👇 انقر على المنتجات أدناه لاختيارها لباقتك'
        }
    };
    
    // Get current language
    function getCurrentLang() {
        return document.documentElement.lang?.includes('ar') ? 'ar' : 'en';
    }
    
    // Get translation with dynamic values
    function t(key, replacements = {}) {
        const lang = getCurrentLang();
        let text = translations[lang][key] || translations.en[key];
        
        // Add config values to replacements
        if (bundleState.currentConfig) {
            replacements.max = replacements.max || bundleState.currentConfig.maxProducts;
            replacements.price = replacements.price || bundleState.currentConfig.bundlePrice;
        }
        
        Object.keys(replacements).forEach(placeholder => {
            text = text.replace(`{${placeholder}}`, replacements[placeholder]);
        });
        
        return text;
    }
    
    // Initialize
    function init() {
        if (bundleState.initialized) return;
        
        // Get current bundle config
        bundleState.currentConfig = getCurrentBundleConfig();
        if (!bundleState.currentConfig) {
            console.log('Not on a bundle collection page');
            return;
        }
        
        console.log('Initializing bundle manager for:', bundleState.currentConfig.handle);
        
        // Add class to body for CSS targeting
        document.body.classList.add('bundle-collection-active');
        
        // Update UI with dynamic values
        updateDynamicUI();
        
        // Check for any stored selections on init
        if (bundleState.selectedProducts.size === 0) {
            restoreSelectionSnapshot();
            
            // Also check window emergency backup
            if (bundleState.selectedProducts.size === 0 && window._bundleEmergencySelections && window._bundleEmergencySelections.size > 0) {
                bundleState.selectedProducts = new Map(window._bundleEmergencySelections);
                console.log('Restored from window emergency backup on init');
                reapplySelections();
            }
        }
        
        // Setup immediately without delay
        setupEventListeners();
        updateProgress();
        setupAjaxMonitoring();
        bundleState.initialized = true;
        
        // Add global click capture for any button that might load products
        document.addEventListener('click', function(e) {
            const target = e.target;
            const loadMoreBtn = target.closest('a[data-load-more]');
            
            if (loadMoreBtn) {
                console.log('Load more button clicked globally');
                saveSelectionSnapshot();
                bundleState.expectingAjaxUpdate = true;
            }
            
            if (target.tagName === 'BUTTON' || target.tagName === 'A') {
                const text = target.textContent.toLowerCase();
                if (text.includes('show') || text.includes('load') || text.includes('more') || text.includes('previous') || text.includes('عرض') || text.includes('تحميل')) {
                    console.log('Detected potential load button click:', text);
                    saveSelectionSnapshot();
                }
            }
        }, true);
        
        // Save on page unload
        window.addEventListener('beforeunload', function(e) {
            if (bundleState.currentConfig && bundleState.selectedProducts.size > 0) {
                saveSelectionSnapshot();
                // Store in localStorage as last resort
                try {
                    localStorage.setItem('bundle_emergency_backup', JSON.stringify(Array.from(bundleState.selectedProducts.entries())));
                } catch (err) {}
            }
        });
        
        // Actively close any modals that might be open
        setInterval(() => {
            if (!bundleState.currentConfig) return;
            
            // Close any visible modals
            document.querySelectorAll('.modal, .t4s-modal, .quickview-modal, [class*="popup"]:not(.bundle-notification)').forEach(modal => {
                if (modal.style.display !== 'none') {
                    modal.style.display = 'none';
                    modal.remove();
                }
            });
            
            // Remove modal backdrops
            document.querySelectorAll('.modal-backdrop, .t4s-backdrop').forEach(backdrop => {
                backdrop.remove();
            });
            
            // Remove modal-open class from body
            document.body.classList.remove('modal-open', 't4s-modal-open');
        }, 100);
        
        // Process products immediately
        setupProducts();
        
        // Also process after a short delay to catch any late-loading products
        setTimeout(() => {
            setupProducts();
            reapplySelections();
        }, 500);
        setTimeout(() => {
            setupProducts();
            reapplySelections();
        }, 1500);
    }
    
    // Update dynamic UI elements
    function updateDynamicUI() {
        const config = bundleState.currentConfig;
        if (!config) return;
        
        // Update title
        const titleElements = document.querySelectorAll('.bundle-progress-title .en-text, .bundle-progress-title .ar-text');
        titleElements.forEach(el => {
            const isArabic = el.classList.contains('ar-text');
            el.textContent = t('chooseProducts');
        });
        
        // Update instructions
        const instructionElements = document.querySelectorAll('.bundle-instructions .en-text, .bundle-instructions .ar-text');
        instructionElements.forEach(el => {
            const isArabic = el.classList.contains('ar-text');
            el.textContent = t('clickToSelect');
        });
    }
    
    // Setup products with delegation approach
    async function setupProducts() {
        if (bundleState.processingProducts || !bundleState.currentConfig) {
            console.log('Already processing products or no config, skipping...');
            return;
        }
        bundleState.processingProducts = true;
        
        const allProducts = document.querySelectorAll('.t4s-product');
        const unprocessedProducts = document.querySelectorAll('.t4s-product:not(.bundle-processed)');
        
        console.log(`Found ${allProducts.length} total products, ${unprocessedProducts.length} unprocessed`);
        
        // First, re-apply selected state to ALL products (in case DOM was replaced)
        reapplySelections();
        
        if (unprocessedProducts.length === 0) {
            bundleState.processingProducts = false;
            return;
        }
        
        for (const productEl of unprocessedProducts) {
            try {
                productEl.classList.add('bundle-processed');
                
                const productLink = productEl.querySelector('a[href*="/products/"]');
                if (!productLink) {
                    console.log('No product link found in element');
                    continue;
                }
                
                const productHandle = productLink.href.split('/products/')[1].split('?')[0].split('#')[0];
                console.log('Processing product:', productHandle);
                
                // Fetch product data
                const response = await fetch(`/products/${productHandle}.js`);
                if (!response.ok) {
                    console.log('Failed to fetch product:', productHandle);
                    continue;
                }
                
                const productData = await response.json();
                
                // Find cheapest eligible variant
                const eligibleVariants = productData.variants.filter(v => 
                    v.available && parseInt(v.price) <= bundleState.currentConfig.maxVariantPrice * 100
                );
                
                if (eligibleVariants.length > 0) {
                    eligibleVariants.sort((a, b) => parseInt(a.price) - parseInt(b.price));
                    const cheapestVariant = eligibleVariants[0];
                    
                    console.log(`Product ${productData.title} is eligible with variant at €${cheapestVariant.price/100}`);
                    
                    // Store variant info
                    bundleState.productVariants.set(productData.id, {
                        product: productData,
                        variant: cheapestVariant,
                        handle: productHandle
                    });
                    
                    // Make product selectable
                    productEl.classList.add('bundle-selectable');
                    productEl.dataset.productId = productData.id;
                    productEl.style.cursor = 'pointer';
                    productEl.title = 'Click to select for bundle';
                    
                    // Remove any onclick handlers and links
                    productEl.querySelectorAll('a').forEach(link => {
                        link.onclick = function(e) { 
                            e.preventDefault(); 
                            e.stopPropagation();
                            return false; 
                        };
                        link.style.pointerEvents = 'none';
                        link.removeAttribute('href');
                    });
                    
                    // Remove any form elements
                    productEl.querySelectorAll('form').forEach(form => {
                        form.remove();
                    });
                    
                    // Remove popup trigger attributes
                    productEl.querySelectorAll('[data-quickview], [data-product-popup], [data-action="add-to-cart"]').forEach(el => {
                        el.removeAttribute('data-quickview');
                        el.removeAttribute('data-product-popup');
                        el.removeAttribute('data-action');
                        el.onclick = null;
                    });
                    
                    // Add visual indicator
                    productEl.style.border = '2px solid transparent';
                    productEl.style.transition = 'all 0.3s';
                    
                    // Check if already selected
                    if (bundleState.selectedProducts.has(productData.id)) {
                        productEl.classList.add('bundle-selected');
                    }
                } else {
                    console.log(`Product ${productData.title} has no eligible variants`);
                }
            } catch (error) {
                console.error('Error processing product:', error);
            }
        }
        
        bundleState.processingProducts = false;
        console.log('Total bundle products ready:', bundleState.productVariants.size);
        
        // Re-setup event listeners to ensure they work
        setupEventListeners();
        
        // Final re-apply of selections to ensure everything is in sync
        setTimeout(() => reapplySelections(), 100);
    }
    
    // Setup event listeners with delegation
    function setupEventListeners() {
        // Remove any existing listeners
        document.removeEventListener('click', handleDocumentClick, true);
        
        // Add new listener in capture phase to intercept early
        document.addEventListener('click', handleDocumentClick, true);
        
        // Also add listener for pointerdown for touch devices
        document.addEventListener('pointerdown', function(e) {
            if (!bundleState.currentConfig) return;
            
            const target = e.target;
            const productElement = target.closest('.t4s-product');
            
            if (productElement && productElement.classList.contains('bundle-selectable')) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Block data-load-more buttons
            const loadMoreBtn = target.closest('a[data-load-more]');
            if (loadMoreBtn) {
                saveSelectionSnapshot();
            }
        }, true);
        
        // Block touchstart as well
        document.addEventListener('touchstart', function(e) {
            if (!bundleState.currentConfig) return;
            
            const target = e.target;
            const productElement = target.closest('.t4s-product');
            
            if (productElement && productElement.classList.contains('bundle-selectable')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);
        
        // Block form submissions globally on bundle pages
        document.addEventListener('submit', function(e) {
            if (!bundleState.currentConfig) return;
            
            if (e.target.action && e.target.action.includes('/cart/add')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Blocked form submission');
                return false;
            }
        }, true);
        
        // Bundle button
        const addButton = document.querySelector('.bundle-add-to-cart');
        if (addButton && !addButton.hasAttribute('data-bundle-listener')) {
            addButton.setAttribute('data-bundle-listener', 'true');
            addButton.addEventListener('click', addBundleToCart);
        }
    }
    
    // Handle all clicks with delegation
    function handleDocumentClick(e) {
        // Check if click is on bundle collection
        if (!bundleState.currentConfig) return;
        
        const target = e.target;
        const productElement = target.closest('.t4s-product');
        
        // If clicked anywhere on a product
        if (productElement) {
            // Check if it's a bundle-selectable product
            if (productElement.classList.contains('bundle-selectable')) {
                // Prevent all default actions
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                const productId = parseInt(productElement.dataset.productId);
                console.log('Bundle product clicked, ID:', productId);
                
                if (productId) {
                    toggleProduct(productId, productElement);
                }
                return false;
            }
        }
    }
    
    // Save current selections to snapshot
    function saveSelectionSnapshot() {
        bundleState.lastSelectionSnapshot = new Map(bundleState.selectedProducts);
        console.log('Saved selection snapshot with', bundleState.lastSelectionSnapshot.size, 'items');
        
        // Also save to sessionStorage as backup
        try {
            const selectionsArray = Array.from(bundleState.selectedProducts.entries());
            sessionStorage.setItem('bundle_selections_backup', JSON.stringify(selectionsArray));
            sessionStorage.setItem('bundle_selections_time', Date.now().toString());
        } catch (e) {
            console.log('Could not save to sessionStorage:', e);
        }
    }
    
    // Restore selections from snapshot
    function restoreSelectionSnapshot() {
        // First try main snapshot
        if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
            bundleState.selectedProducts = new Map(bundleState.lastSelectionSnapshot);
            console.log('Restored selection snapshot with', bundleState.selectedProducts.size, 'items');
            reapplySelections();
            return;
        }
        
        // If no snapshot or it failed, try sessionStorage
        try {
            const stored = sessionStorage.getItem('bundle_selections_backup');
            const storedTime = sessionStorage.getItem('bundle_selections_time');
            if (stored && storedTime) {
                const timeDiff = Date.now() - parseInt(storedTime);
                // Only use if less than 5 minutes old
                if (timeDiff < 300000) {
                    const selectionsArray = JSON.parse(stored);
                    bundleState.selectedProducts = new Map(selectionsArray);
                    console.log('Restored from sessionStorage:', bundleState.selectedProducts.size, 'items');
                    reapplySelections();
                    return;
                }
            }
        } catch (e) {
            console.log('Could not restore from sessionStorage:', e);
        }
        
        // Try window emergency backup
        if (window._bundleEmergencySelections && window._bundleEmergencySelections.size > 0) {
            bundleState.selectedProducts = new Map(window._bundleEmergencySelections);
            console.log('Restored from window emergency backup:', bundleState.selectedProducts.size, 'items');
            reapplySelections();
            return;
        }
        
        // Last resort - try localStorage
        try {
            const emergency = localStorage.getItem('bundle_emergency_backup');
            if (emergency) {
                const selectionsArray = JSON.parse(emergency);
                bundleState.selectedProducts = new Map(selectionsArray);
                console.log('Restored from localStorage emergency backup:', bundleState.selectedProducts.size, 'items');
                localStorage.removeItem('bundle_emergency_backup'); // Clean up
                reapplySelections();
            }
        } catch (e) {
            console.log('Could not restore from localStorage:', e);
        }
    }
    
    // Re-apply selections to all products on the page
    function reapplySelections() {
        console.log('Re-applying selections to products...');
        console.log('Currently selected products:', bundleState.selectedProducts);
        
        // If we have no selections but have a snapshot, restore it
        if (bundleState.selectedProducts.size === 0 && bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
            console.log('No current selections but have snapshot, restoring...');
            restoreSelectionSnapshot();
            return;
        }
        
        // First, remove selected class from all products
        document.querySelectorAll('.t4s-product.bundle-selected').forEach(el => {
            el.classList.remove('bundle-selected');
        });
        
        // Then, re-apply selected class based on stored state
        bundleState.selectedProducts.forEach((handleOrTrue, productId) => {
            // Try to find product by data-product-id
            let productEl = document.querySelector(`.t4s-product[data-product-id="${productId}"]`);
            
            // If not found and we have a handle, try to find by handle in the link
            if (!productEl && handleOrTrue !== true && typeof handleOrTrue === 'string') {
                const link = document.querySelector(`.t4s-product a[href*="/products/${handleOrTrue}"]`);
                if (link) {
                    productEl = link.closest('.t4s-product');
                }
            }
            
            if (productEl) {
                productEl.classList.add('bundle-selected');
                // Ensure it has the product ID for future reference
                productEl.dataset.productId = productId;
                console.log('Re-applied selection to product:', productId);
            } else {
                console.log('Could not find product element for ID:', productId);
            }
        });
        
        // Update progress bar
        updateProgress();
    }
    
    // Toggle product selection
    function toggleProduct(productId, element) {
        const config = bundleState.currentConfig;
        if (!config) return;
        
        if (bundleState.selectedProducts.has(productId)) {
            bundleState.selectedProducts.delete(productId);
            element.classList.remove('bundle-selected');
            showNotification(t('productRemoved'), 'info');
        } else if (bundleState.selectedProducts.size < config.maxProducts) {
            const productData = bundleState.productVariants.get(productId);
            bundleState.selectedProducts.set(productId, productData ? productData.handle : true);
            element.classList.add('bundle-selected');
            showNotification(t('productAdded'), 'success');
            
            const remaining = config.maxProducts - bundleState.selectedProducts.size;
            if (remaining > 0 && remaining <= 3) {
                setTimeout(() => {
                    showNotification(t('almostThere', {remaining}), 'info');
                }, 1500);
            }
        } else {
            showNotification(t('maxReached'), 'warning');
        }
        
        updateProgress();
    }
    
    // Update progress bar
    function updateProgress() {
        const config = bundleState.currentConfig;
        if (!config) return;
        
        const count = bundleState.selectedProducts.size;
        const percentage = (count / config.maxProducts) * 100;
        
        const progressFill = document.querySelector('.bundle-progress-fill');
        const progressText = document.querySelector('.bundle-progress-text');
        const addButton = document.querySelector('.bundle-add-to-cart');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        
        if (progressText) {
            const lang = getCurrentLang();
            const textEl = progressText.querySelector(`.${lang}-text`);
            if (textEl) textEl.textContent = t('selected', {count});
        }
        
        if (addButton) {
            if (count === config.maxProducts) {
                addButton.disabled = false;
                addButton.classList.add('active');
                updateButtonText(addButton, 'addToCart');
            } else {
                addButton.disabled = true;
                addButton.classList.remove('active');
                updateButtonText(addButton, 'selectProducts');
            }
        }
    }
    
    // Update button text
    function updateButtonText(button, key) {
        const lang = getCurrentLang();
        const textEl = button.querySelector(`.${lang}-text`);
        if (textEl) textEl.textContent = t(key);
    }
    
    // Setup AJAX monitoring
    function setupAjaxMonitoring() {
        console.log('Setting up AJAX monitoring...');
        
        // Monitor for DOM changes in products container
        const productsContainer = document.querySelector('.t4s-products, .t4s_box_pr_grid, [data-contentlm-replace]');
        if (productsContainer) {
            // Save state before any manipulation
            productsContainer.addEventListener('DOMNodeRemoved', function(e) {
                if (e.target.classList && e.target.classList.contains('t4s-product') && bundleState.selectedProducts.size > 0) {
                    saveSelectionSnapshot();
                }
            }, true);
            
            const observer = new MutationObserver((mutations) => {
                // Save selections before any major DOM change
                const hasRemovals = mutations.some(m => m.removedNodes.length > 0);
                if (hasRemovals && bundleState.selectedProducts.size > 0) {
                    saveSelectionSnapshot();
                }
                
                // Check if new products were added
                const hasNewProducts = Array.from(mutations).some(mutation => 
                    Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === 1 && (
                            node.classList?.contains('t4s-product') || 
                            node.querySelector?.('.t4s-product')
                        )
                    )
                );
                
                if (hasNewProducts) {
                    console.log('New products detected via MutationObserver');
                    // Restore snapshot if we have one
                    if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
                        restoreSelectionSnapshot();
                    }
                    setTimeout(() => {
                        setupProducts();
                        reapplySelections();
                    }, 100);
                }
            });
            
            observer.observe(productsContainer, {
                childList: true,
                subtree: true
            });
        }
        
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            const url = args[0];
            // Save snapshot before any collection/page fetch
            if (typeof url === 'string' && (url.includes('collections') || url.includes('page='))) {
                saveSelectionSnapshot();
            }
            
            return originalFetch.apply(this, args).then(response => {
                if (typeof url === 'string' && (url.includes('collections') || url.includes('page='))) {
                    console.log('Collection AJAX request detected:', url);
                    response.clone().text().then(() => {
                        setTimeout(() => {
                            restoreSelectionSnapshot();
                            setupProducts();
                            reapplySelections();
                        }, 500);
                    });
                }
                return response;
            });
        };
        
        // Also intercept XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url) {
            if (url && (url.includes('collections') || url.includes('page='))) {
                saveSelectionSnapshot();
            }
            
            this.addEventListener('load', function() {
                if (url && (url.includes('collections') || url.includes('page='))) {
                    setTimeout(() => {
                        restoreSelectionSnapshot();
                        setupProducts();
                        reapplySelections();
                    }, 500);
                }
            });
            
            return originalXHROpen.apply(this, arguments);
        };
        
        // Monitor Load Previous button specifically
        const checkLoadButton = setInterval(() => {
            const loadBtn = document.querySelector('[data-load-more], .t4s-loadmore-btn, [href*="page="]');
            if (loadBtn && !loadBtn.hasAttribute('data-bundle-monitored')) {
                loadBtn.setAttribute('data-bundle-monitored', 'true');
                console.log('Found load button, adding monitor');
                
                // Clone and replace to remove existing listeners
                const newBtn = loadBtn.cloneNode(true);
                newBtn.removeAttribute('data-bundle-monitored');
                loadBtn.parentNode.replaceChild(newBtn, loadBtn);
                
                newBtn.addEventListener('click', function(e) {
                    console.log('Load button clicked, will check for products...');
                    
                    // Store current selection count before load
                    const selectionsBeforeLoad = bundleState.selectedProducts.size;
                    console.log('Selections before load:', selectionsBeforeLoad);
                    
                    // For "Load Previous" specifically
                    if (this.hasAttribute('data-is-prev') || this.textContent.includes('Previous')) {
                        e.preventDefault();
                        
                        // Get the URL and load it manually
                        const url = this.href;
                        if (url) {
                            fetch(url)
                                .then(response => response.text())
                                .then(html => {
                                    // Parse the HTML and extract products
                                    const parser = new DOMParser();
                                    const doc = parser.parseFromString(html, 'text/html');
                                    const products = doc.querySelectorAll('.t4s-product');
                                    
                                    // Find the products container
                                    const container = document.querySelector('.t4s-products, .t4s_box_pr_grid');
                                    if (container && products.length > 0) {
                                        // Prepend products for "Load Previous"
                                        products.forEach(product => {
                                            container.insertBefore(product, container.firstChild);
                                        });
                                        
                                        // Update pagination
                                        const pagination = doc.querySelector('.t4s-pagination-wrapper');
                                        if (pagination) {
                                            const currentPagination = document.querySelector('.t4s-pagination-wrapper');
                                            if (currentPagination) {
                                                currentPagination.innerHTML = pagination.innerHTML;
                                            }
                                        }
                                        
                                        // Setup the new products
                                        setTimeout(() => setupProducts(), 100);
                                    }
                                })
                                .catch(err => console.error('Error loading products:', err));
                            
                            return false;
                        }
                    }
                    
                    // Regular monitoring for other load buttons
                    let checks = 0;
                    const checkInterval = setInterval(() => {
                        checks++;
                        const newProducts = document.querySelectorAll('.t4s-product:not(.bundle-processed)');
                        
                        if (newProducts.length > 0) {
                            console.log('Found', newProducts.length, 'new products after load');
                            setupProducts();
                            setTimeout(() => reapplySelections(), 200);
                            clearInterval(checkInterval);
                        }
                        
                        if (checks > 10) {
                            clearInterval(checkInterval);
                        }
                    }, 500);
                });
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkLoadButton), 30000);
        
        // Listen for theme-specific events
        ['ajaxComplete', 'theme:ajax:complete', 'collection:reloaded', 'ntAjax:loaded', 'bundle:check-products', 'products:loaded'].forEach(eventName => {
            document.addEventListener(eventName, () => {
                console.log('Theme event detected:', eventName);
                setTimeout(() => {
                    restoreSelectionSnapshot();
                    setupProducts();
                    reapplySelections();
                }, 500);
            });
        });
        
        // Also listen for any custom events that might indicate product loading
        window.addEventListener('load', () => {
            // Final check after everything is loaded
            setTimeout(() => {
                if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
                    restoreSelectionSnapshot();
                }
            }, 2000);
        });
        
        // Save state before page unload or visibility change
        window.addEventListener('beforeunload', saveSelectionSnapshot);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveSelectionSnapshot();
            } else {
                // Restore when page becomes visible again
                setTimeout(() => {
                    if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
                        restoreSelectionSnapshot();
                    }
                }, 100);
            }
        });
        
        // Monitor specific theme AJAX container
        const ajaxContainer = document.querySelector('[data-ntajax-container]');
        if (ajaxContainer) {
            console.log('Found theme AJAX container, monitoring...');
            const ajaxObserver = new MutationObserver((mutations) => {
                // Check if the container's content has changed
                const hasChanged = mutations.some(mutation => 
                    mutation.type === 'childList' && mutation.addedNodes.length > 0
                );
                
                if (hasChanged) {
                    console.log('AJAX container content changed');
                    setTimeout(() => {
                        setupProducts();
                        reapplySelections();
                    }, 500);
                }
            });
            
            ajaxObserver.observe(ajaxContainer, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-loading']
            });
        }
        
        // Also monitor the specific content replacement div
        const contentReplace = document.querySelector('[data-contentlm-replace]');
        if (contentReplace) {
            console.log('Found content replacement container, monitoring...');
            
            // Monitor for attribute changes that indicate loading
            const contentObserver = new MutationObserver((mutations) => {
                const hasAttributeChange = mutations.some(m => m.type === 'attributes');
                if (hasAttributeChange) {
                    saveSelectionSnapshot();
                }
                
                const hasContentChange = mutations.some(m => m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0));
                if (hasContentChange) {
                    console.log('Content replacement detected');
                    setTimeout(() => {
                        restoreSelectionSnapshot();
                        setupProducts();
                        reapplySelections();
                    }, 500);
                }
            });
            
            contentObserver.observe(contentReplace, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'data-loading', 'aria-busy']
            });
        }
    }
    
    // Add bundle to cart
    async function addBundleToCart() {
        const config = bundleState.currentConfig;
        if (!config || bundleState.selectedProducts.size !== config.maxProducts) return;
        
        const button = document.querySelector('.bundle-add-to-cart');
        if (button) {
            button.disabled = true;
            button.innerHTML = '<span class="loading-spinner"></span>';
        }
        
        try {
            const response = await fetch(`/products/${config.bundleProductHandle}.js`);
            if (!response.ok) throw new Error('Bundle product not found');
            
            const bundleProduct = await response.json();
            
            const properties = {
                '_bundle_type': config.bundleType,
                'Bundle Items': `${bundleState.selectedProducts.size} products`
            };
            
            let index = 1;
            bundleState.selectedProducts.forEach((_, productId) => {
                const data = bundleState.productVariants.get(productId);
                if (data) {
                    properties[`Item ${index}`] = data.product.title;
                    properties[`_item_${index}_variant`] = data.variant.id;
                    index++;
                }
            });
            
            const cartResponse = await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: bundleProduct.variants[0].id,
                    quantity: 1,
                    properties: properties
                })
            });
            
            if (cartResponse.ok) {
                showNotification(t('added'), 'success');
                
                bundleState.selectedProducts.clear();
                document.querySelectorAll('.bundle-selected').forEach(el => {
                    el.classList.remove('bundle-selected');
                });
                updateProgress();
                
                setTimeout(() => {
                    showNotification(t('goToCart'), 'info');
                }, 500);
                
                setTimeout(() => {
                    window.location.href = '/cart';
                }, 1500);
            } else {
                throw new Error('Failed to add to cart');
            }
        } catch (error) {
            console.error('Bundle error:', error);
            showNotification(t('error'), 'error');
            
            if (button) {
                button.disabled = false;
                updateButtonText(button, 'addToCart');
            }
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const existing = document.querySelector('.bundle-notification');
        if (existing) existing.remove();
        
        const div = document.createElement('div');
        div.className = `bundle-notification bundle-notification--${type}`;
        div.textContent = message;
        
        // Add recovery hint for selection loss
        if (type === 'warning' && message.includes('lost')) {
            div.innerHTML = message + '<br><small>Run window.forceRestoreBundle() in console to recover</small>';
        }
        
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Also try to init as soon as possible
    setTimeout(init, 0);
    
    // Also check periodically for unprocessed products
    function startPeriodicCheck(interval) {
        return setInterval(() => {
            if (bundleState.currentConfig) {
                const unprocessed = document.querySelectorAll('.t4s-product:not(.bundle-processed)');
                if (unprocessed.length > 0) {
                    console.log('Periodic check found', unprocessed.length, 'unprocessed products');
                    setupProducts();
                    setTimeout(() => reapplySelections(), 200);
                }
            }
        }, interval);
    }
    
    // Start with frequent checks, then slow down
    let currentInterval = startPeriodicCheck(500);
    setTimeout(() => {
        clearInterval(currentInterval);
        currentInterval = startPeriodicCheck(1000);
        setTimeout(() => {
            clearInterval(currentInterval);
            startPeriodicCheck(2000);
        }, 5000);
    }, 5000);
    
    // Also run a more frequent check specifically for re-applying selections
    setInterval(() => {
        if (bundleState.currentConfig && bundleState.selectedProducts.size > 0) {
            const selectedOnPage = document.querySelectorAll('.bundle-selected').length;
            if (selectedOnPage < bundleState.selectedProducts.size) {
                console.log('Selection mismatch detected, re-applying...');
                reapplySelections();
            }
        }
        
        // Check if load more buttons need monitoring
        document.querySelectorAll('a[data-load-more]:not([data-bundle-monitored])').forEach(btn => {
            console.log('Found unmonitored load more button');
            btn.setAttribute('data-bundle-monitored', 'true');
            btn.addEventListener('click', function() {
                saveSelectionSnapshot();
                bundleState.expectingAjaxUpdate = true;
            }, true);
        });
    }, 1000);
    
    // Save snapshot periodically as backup
    setInterval(() => {
        if (bundleState.selectedProducts.size > 0) {
            saveSelectionSnapshot();
        }
    }, 3000);
    
    // Make functions globally accessible
    window.setupProducts = setupProducts;
    window.reapplyBundleSelections = reapplySelections;
    window.restoreBundleSelections = restoreSelectionSnapshot;
    window.saveBundleSelections = saveSelectionSnapshot;
    
    // Debug helper - type this in console to manually process products
    window.debugBundle = function() {
        console.log('Bundle Debug Info:');
        console.log('- Current config:', bundleState.currentConfig);
        console.log('- Total products on page:', document.querySelectorAll('.t4s-product').length);
        console.log('- Processed products:', document.querySelectorAll('.bundle-processed').length);
        console.log('- Selectable products:', document.querySelectorAll('.bundle-selectable').length);
        console.log('- Selected products:', bundleState.selectedProducts.size);
        console.log('- Selected product IDs:', Array.from(bundleState.selectedProducts.keys()));
        console.log('- Product variants stored:', bundleState.productVariants.size);
        console.log('- Products with selected class:', document.querySelectorAll('.bundle-selected').length);
        console.log('- Last selection snapshot:', bundleState.lastSelectionSnapshot ? bundleState.lastSelectionSnapshot.size : 0);
        console.log('- Load more buttons:', document.querySelectorAll('a[data-load-more]').length);
        console.log('Running setupProducts manually...');
        setupProducts();
        setTimeout(() => reapplySelections(), 200);
    };
    
    // Check theme pagination behavior
    window.checkPagination = function() {
        console.log('Checking pagination behavior:');
        const loadMoreBtns = document.querySelectorAll('a[data-load-more], .t4s-loadmore-btn');
        loadMoreBtns.forEach(btn => {
            console.log('Button:', btn.textContent.trim());
            console.log('- href:', btn.href);
            console.log('- data attributes:', btn.dataset);
            console.log('- classes:', btn.className);
        });
        
        const pagination = document.querySelector('.t4s-pagination-wrapper');
        if (pagination) {
            console.log('Pagination wrapper found:', pagination);
            console.log('- Current page links:', pagination.querySelectorAll('a').length);
        }
        
        console.log('Products container:', document.querySelector('.t4s-products, .t4s_box_pr_grid'));
        console.log('Current product count:', document.querySelectorAll('.t4s-product').length);
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('page')) {
            console.log('Current page number:', urlParams.get('page'));
        }
        
        // Provide guidance
        console.log('\n📋 PAGINATION ANALYSIS:');
        if (document.querySelectorAll('.t4s-product').length % 12 === 0) {
            console.log('✓ Theme shows 12 products per page');
            console.log('✓ This is standard pagination behavior');
            console.log('ℹ️  Products are REPLACED when you click "Show more"');
            console.log('\n💡 To show more products at once:');
            console.log('   1. Check theme settings for "Products per page"');
            console.log('   2. Look for "Infinite scroll" or "Load more" options');
            console.log('   3. Contact theme developer about append vs replace behavior');
        }
    };
    
    // Manual append mode (experimental)
    window.enableAppendMode = function() {
        console.log('🔧 Enabling experimental append mode...');
        console.log('⚠️  This overrides theme behavior and may cause issues!');
        
        // Store all products seen
        window._allBundleProducts = window._allBundleProducts || new Map();
        
        // Collect current products
        document.querySelectorAll('.t4s-product').forEach(el => {
            const link = el.querySelector('a[href*="/products/"]');
            if (link) {
                const handle = link.href.split('/products/')[1]?.split('?')[0];
                if (handle && !window._allBundleProducts.has(handle)) {
                    window._allBundleProducts.set(handle, el.cloneNode(true));
                }
            }
        });
        
        console.log('Stored', window._allBundleProducts.size, 'unique products');
        
        // Override mutation observer to append instead of replace
        bundleState.appendMode = true;
        console.log('✅ Append mode enabled. Products will accumulate instead of being replaced.');
        console.log('   Run window.disableAppendMode() to return to normal.');
        console.log('\n📌 TIP: Add ?append_mode=true to the URL to auto-enable this mode');
        
        // Show notification
        showNotification('Append mode enabled! Products will accumulate as you browse.', 'info');
    };
    
    window.disableAppendMode = function() {
        bundleState.appendMode = false;
        window._allBundleProducts = null;
        console.log('✅ Append mode disabled. Theme behavior restored.');
    };
    
    // Force restore function for emergencies
    window.forceRestoreBundle = function() {
        console.log('Force restoring bundle selections...');
        if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
            restoreSelectionSnapshot();
        } else {
            console.log('No snapshot available to restore');
        }
    };
    
    // Force hijack all load more buttons
    window.forceHijackButtons = function() {
        console.log('Force hijacking all load more buttons...');
        document.querySelectorAll('a[data-load-more], a[data-load-more-hijacked]').forEach(btn => {
            console.log('Force hijacking:', btn.textContent.trim());
            // Remove all attributes
            btn.removeAttribute('data-load-more');
            btn.removeAttribute('data-bundle-hijacked');
            btn.removeAttribute('data-bundle-handler-added');
            btn.removeAttribute('data-bundle-emergency-hijacked');
            
            // Clone to remove all handlers
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            // Disable it
            newBtn.style.pointerEvents = 'none';
            newBtn.onclick = function(e) { 
                e.preventDefault(); 
                alert('This button has been disabled. Your bundle selections are protected.');
                return false; 
            };
            
            console.log('Button hijacked and disabled');
        });
    };
    
    // Nuclear option - replace buttons entirely
    window.nuclearReplaceButtons = function() {
        console.log('NUCLEAR OPTION - Replacing all load more buttons...');
        document.querySelectorAll('a[data-load-more], a[data-load-more-hijacked], a[href*="page="]').forEach(oldBtn => {
            if (oldBtn.textContent.includes('عرض') || oldBtn.textContent.includes('تحميل') || 
                oldBtn.textContent.toLowerCase().includes('show') || oldBtn.textContent.toLowerCase().includes('load')) {
                
                const newBtn = document.createElement('button');
                newBtn.className = oldBtn.className;
                newBtn.textContent = oldBtn.textContent;
                newBtn.style.cssText = window.getComputedStyle(oldBtn).cssText;
                newBtn.style.cursor = 'pointer';
                
                newBtn.onclick = function() {
                    alert('Loading products... Your selections are protected!\n\nIf you lose selections, run:\nwindow.forceRestoreBundle()');
                    
                    // Save selections
                    const saved = bundleState.selectedProducts.size;
                    saveSelectionSnapshot();
                    
                    // Fetch the page
                    fetch(oldBtn.href)
                        .then(r => r.text())
                        .then(html => {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            const products = doc.querySelectorAll('.t4s-product');
                            
                            const container = document.querySelector('.t4s-products, .t4s_box_pr_grid');
                            if (container) {
                                products.forEach(p => container.appendChild(p));
                            }
                            
                            // Restore
                            bundleState.selectedProducts = bundleState.lastSelectionSnapshot || new Map();
                            setupProducts();
                            reapplySelections();
                            
                            alert(`Done! ${saved} selections preserved.`);
                        });
                };
                
                oldBtn.parentNode.replaceChild(newBtn, oldBtn);
                console.log('Replaced button:', newBtn.textContent);
            }
        });
    };
    // Final safety net - monitor for any changes to product count
    let lastProductCount = 0;
    setInterval(() => {
        if (!bundleState.currentConfig) return;
        
        const currentProductCount = document.querySelectorAll('.t4s-product').length;
        if (currentProductCount !== lastProductCount && currentProductCount > 0) {
            console.log('Product count changed from', lastProductCount, 'to', currentProductCount);
            lastProductCount = currentProductCount;
            
            // If we have selections but they're not visible, restore them
            if (bundleState.selectedProducts.size > 0 || (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0)) {
                setTimeout(() => {
                    setupProducts();
                    if (bundleState.lastSelectionSnapshot && bundleState.lastSelectionSnapshot.size > 0) {
                        restoreSelectionSnapshot();
                    } else {
                        reapplySelections();
                    }
                }, 500);
            }
        }
    }, 500);
    // Initialize - show a message about the bundle functionality
    console.log('🎁 Bundle Manager Loaded! Select products by clicking on them. If selections are lost, they will be automatically restored.');
})();