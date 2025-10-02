// Mr. Bluejays SPA - JavaScript Application with Backend Integration

// Backend API URL
const API_URL = 'http://localhost:3000';

// Product Data (fallback for when backend is not available)
const fallbackProducts = [
    {
        id: 1,
        name: "Classic 1460 Boot",
        price: 169.99,
        image: "Classic Boot",
        imageUrl: "http://localhost:3000/images/classic-boot.jpg",
        description: "The original Mr. Bluejays boot. 8-eye lace-up with air-cushioned sole and durable leather upper. Built to last a lifetime.",
        features: ["Air-cushioned sole", "Premium leather", "8-eye lace design", "Goodyear welted"]
    },
    {
        id: 2,
        name: "Steel Toe Worker",
        price: 199.99,
        image: "Work Boot",
        imageUrl: "http://localhost:3000/images/steel-toe.jpg",
        description: "Heavy-duty steel toe boot for industrial work. Meets all safety standards while maintaining classic Mr. Bluejays style.",
        features: ["Steel toe protection", "Slip-resistant sole", "Oil and chemical resistant", "Electrical hazard protection"]
    },
    {
        id: 3,
        name: "Chelsea Boot",
        price: 159.99,
        image: "Chelsea Boot",
        imageUrl: "http://localhost:3000/images/chelsea.jpg",
        description: "Sleek slip-on design with elastic side panels. Perfect for both casual and semi-formal occasions.",
        features: ["Elastic side panels", "Pull-on design", "Premium leather", "Comfortable all-day wear"]
    },
    {
        id: 4,
        name: "Combat Boot",
        price: 189.99,
        image: "Combat Boot",
        imageUrl: "http://localhost:3000/images/combat.jpg",
        description: "Military-inspired design with rugged construction. Built for extreme conditions and urban adventures.",
        features: ["10-eye lace-up", "Reinforced toe and heel", "Tactical design", "All-terrain grip"]
    },
    {
        id: 5,
        name: "Hiking Boot",
        price: 219.99,
        image: "Hiking Boot",
        imageUrl: "http://localhost:3000/images/hiking.jpg",
        description: "Waterproof hiking boot with superior ankle support. Designed for outdoor enthusiasts and trail blazers.",
        features: ["Waterproof membrane", "Ankle support", "Vibram sole", "Breathable lining"]
    },
    {
        id: 6,
        name: "Classic Oxford",
        price: 149.99,
        image: "Oxford Shoe",
        imageUrl: "http://localhost:3000/images/oxford.jpg",
        description: "Timeless oxford design with modern comfort. Perfect for professional and formal settings.",
        features: ["Classic oxford style", "Leather lining", "Cushioned insole", "Professional appearance"]
    }
];

let products = fallbackProducts;

// Application State
let currentPage = 'home';
let cart = JSON.parse(localStorage.getItem('mrBluejaysCart')) || [];

// DOM Elements
const app = document.getElementById('app');
const cartCount = document.getElementById('cart-count');
const productGrid = document.getElementById('product-grid');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const modal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadProductsFromBackend();
    updateCartDisplay();
    initializeModal();
    initializeVulnerableFeatures();

    // Load home page by default
    showPage('home');
});

// Load products from backend API
async function loadProductsFromBackend() {
    try {
        const response = await fetch(`${API_URL}/api/products`);
        if (response.ok) {
            const backendProducts = await response.json();
            products = backendProducts.map(p => ({
                ...p,
                features: p.features || fallbackProducts.find(fp => fp.id === p.id)?.features || []
            }));
            console.log('Products loaded from backend');
        }
    } catch (error) {
        console.log('Backend not available, using fallback products');
        products = fallbackProducts;
    }
    renderProducts();
}

// Initialize vulnerable features for demo
function initializeVulnerableFeatures() {
    // Add custom image loader section to product page
    const productPage = document.getElementById('products-page');
    const customLoaderDiv = document.createElement('div');
    customLoaderDiv.className = 'custom-image-section';
    customLoaderDiv.innerHTML = `
        <div style="margin: 40px auto; max-width: 600px; padding: 20px; border: 2px solid #ffff00; background: #111;">
            <h3 style="color: #ffff00; margin-bottom: 15px;">Load Custom Product Image</h3>
            <p style="color: #ccc; margin-bottom: 15px;">Enter a URL to load a custom product image:</p>
            <p style="color: #ff8800; font-size: 12px; margin-bottom: 15px;">⚠️ Security Note: This feature fetches URLs server-side via /api/product-image endpoint</p>
            <input type="text" id="custom-image-url" placeholder="Enter image URL (e.g., http://example.com/image.jpg)"
                style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #ffff00; margin-bottom: 15px;">
            <button onclick="loadCustomImage()" style="background: #ffff00; color: #000; border: none; padding: 10px 30px; font-weight: bold; cursor: pointer;">
                Load Image
            </button>
            <div id="custom-image-result" style="margin-top: 20px;"></div>
        </div>
    `;
    productPage.querySelector('.container').appendChild(customLoaderDiv);

    // Add URL preview feature
    const aboutPage = document.getElementById('about-page');
    const urlPreviewDiv = document.createElement('div');
    urlPreviewDiv.className = 'url-preview-section';
    urlPreviewDiv.innerHTML = `
        <div style="margin: 40px auto; max-width: 600px; padding: 20px; border: 2px solid #ffff00; background: #111;">
            <h3 style="color: #ffff00; margin-bottom: 15px;">Preview External Catalog</h3>
            <p style="color: #ccc; margin-bottom: 15px;">Preview product catalogs from partner sites:</p>
            <p style="color: #ff8800; font-size: 12px; margin-bottom: 15px;">⚠️ Security Note: Uses /api/preview-url endpoint for server-side requests</p>
            <input type="text" id="preview-url" placeholder="Enter catalog URL"
                style="width: 100%; padding: 10px; background: #000; color: #fff; border: 1px solid #ffff00; margin-bottom: 15px;">
            <button onclick="previewUrl()" style="background: #ffff00; color: #000; border: none; padding: 10px 30px; font-weight: bold; cursor: pointer;">
                Preview
            </button>
            <div id="preview-result" style="margin-top: 20px; color: #ccc;"></div>
        </div>
    `;
    aboutPage.querySelector('.container').appendChild(urlPreviewDiv);
}

// Vulnerable function - loads image through backend SSRF endpoint
async function loadCustomImage() {
    const imageUrl = document.getElementById('custom-image-url').value;
    const resultDiv = document.getElementById('custom-image-result');

    if (!imageUrl) {
        resultDiv.innerHTML = '<p style="color: #ff0000;">Please enter a URL</p>';
        return;
    }

    resultDiv.innerHTML = '<p style="color: #ffff00;">Loading...</p>';

    try {
        // This uses the vulnerable SSRF endpoint
        const response = await fetch(`${API_URL}/api/product-image?url=${encodeURIComponent(imageUrl)}`);

        if (response.ok) {
            const blob = await response.blob();
            const imgUrl = URL.createObjectURL(blob);
            resultDiv.innerHTML = `
                <img src="${imgUrl}" style="max-width: 100%; height: auto; border: 2px solid #ffff00; margin-top: 10px;">
                <p style="color: #00ff00; margin-top: 10px;">Image loaded successfully!</p>
            `;
        } else {
            const error = await response.json();
            resultDiv.innerHTML = `<p style="color: #ff0000;">Error: ${error.details || error.error}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #ff0000;">Failed to load image: ${error.message}</p>`;
    }
}

// Vulnerable function - previews URLs through backend
async function previewUrl() {
    const targetUrl = document.getElementById('preview-url').value;
    const resultDiv = document.getElementById('preview-result');

    if (!targetUrl) {
        resultDiv.innerHTML = '<p style="color: #ff0000;">Please enter a URL</p>';
        return;
    }

    resultDiv.innerHTML = '<p style="color: #ffff00;">Fetching...</p>';

    try {
        const response = await fetch(`${API_URL}/api/preview-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUrl })
        });

        const data = await response.json();

        if (response.ok) {
            resultDiv.innerHTML = `
                <div style="background: #000; padding: 15px; border: 1px solid #333; overflow-x: auto;">
                    <p style="color: #00ff00;">Preview successful!</p>
                    <p style="color: #ffff00;">Status: ${data.status}</p>
                    <p style="color: #ccc;">URL: ${data.fullUrl}</p>
                    <pre style="color: #ccc; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(data.data)}</pre>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<p style="color: #ff0000;">Error: ${data.message || data.error}</p>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #ff0000;">Failed to preview: ${error.message}</p>`;
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;

        // Special handling for cart page
        if (pageName === 'cart') {
            renderCart();
        }
    }
}

// Product Rendering
function renderProducts() {
    productGrid.innerHTML = '';

    products.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductModal(product);

    card.innerHTML = `
        <div class="product-image">${product.image}</div>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">$${product.price}</p>
        <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
            ADD TO CART
        </button>
    `;

    return card;
}

// Product Modal
function initializeModal() {
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function showProductModal(product) {
    modalBody.innerHTML = `
        <div class="modal-product-image">${product.image}</div>
        <h2 class="modal-product-name">${product.name}</h2>
        <p class="modal-product-price">$${product.price}</p>
        <p class="modal-product-description">${product.description}</p>
        <div class="product-features">
            <h4 style="color: #ffff00; margin-bottom: 15px;">Features:</h4>
            <ul style="color: #ccc; margin-bottom: 30px;">
                ${product.features.map(feature => `<li style="margin-bottom: 5px;">${feature}</li>`).join('')}
            </ul>
        </div>
        <button class="add-to-cart" onclick="addToCart(${product.id}); modal.style.display='none';">
            ADD TO CART - $${product.price}
        </button>
    `;

    modal.style.display = 'block';
}

// Shopping Cart Functionality
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    updateCartDisplay();
    showCartNotification();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
    renderCart();
}

function updateCartDisplay() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = '0.00';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>Quantity: ${item.quantity}</p>
            </div>
            <div class="cart-item-actions">
                <span class="cart-item-price">$${itemTotal.toFixed(2)}</span>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;

        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = total.toFixed(2);
}

function saveCart() {
    localStorage.setItem('mrBluejaysCart', JSON.stringify(cart));
}

function showCartNotification() {
    // Simple notification - could be enhanced with a proper toast system
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background-color: #ffff00;
        color: #000;
        padding: 15px 25px;
        font-weight: bold;
        z-index: 3000;
        border: 2px solid #000;
    `;
    notification.textContent = 'Added to cart!';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Checkout functionality (mock)
document.addEventListener('DOMContentLoaded', function() {
    const checkoutBtn = document.querySelector('.checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                alert('Your cart is empty!');
                return;
            }

            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const confirmed = confirm(`Complete purchase for $${total.toFixed(2)}?`);

            if (confirmed) {
                alert('Thank you for your purchase! Your Mr. Bluejays boots will be shipped soon.');
                cart = [];
                saveCart();
                updateCartDisplay();
                renderCart();
            }
        });
    }
});

// Search functionality (bonus feature)
function searchProducts(query) {
    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );

    productGrid.innerHTML = '';
    filtered.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// Responsive mobile menu toggle (if needed)
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('mobile-active');
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Close modal with Escape key
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
    }

    // Quick navigation with number keys
    if (e.key >= '1' && e.key <= '4') {
        const pages = ['home', 'products', 'about', 'cart'];
        const pageIndex = parseInt(e.key) - 1;
        if (pages[pageIndex]) {
            showPage(pages[pageIndex]);

            // Update active nav link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(l => l.classList.remove('active'));
            document.querySelector(`[data-page="${pages[pageIndex]}"]`).classList.add('active');
        }
    }
});

// Smooth scrolling for better UX
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

// Add loading states for better UX
function showLoading(element) {
    element.innerHTML = '<div style="text-align: center; padding: 40px; color: #ffff00;">Loading...</div>';
}

// Initialize application
console.log('Mr. Bluejays SPA loaded successfully!');