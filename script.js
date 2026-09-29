const grid = document.getElementById('productGrid');
const heading = document.getElementById('productHeading');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

function renderProducts(list) {
    grid.innerHTML = list.map(product => `<article class="product-card"><div class="product-image">${product.badge ? `<span class="badge">${product.badge}</span>` : ''}<img src="${product.image}" alt="${product.name}" loading="lazy"></div><div class="product-info"><h3>${product.name}</h3><div class="rating">★★★★★ <span>${product.rating} · ${product.reviews}</span></div><p class="price"><small>₹</small>${product.price.toLocaleString('en-IN')}</p><div class="product-actions"><button class="add-button" data-id="${product.id}">Add to cart</button><button class="buy-button" data-id="${product.id}">Buy now</button></div></div></article>`).join('');
    emptyState.style.display = list.length ? 'none' : 'block';
}
let cartSummary = { items: [], count: 0, subtotal: 0 };
let toastTimer;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function updateCart(summary) {
    cartSummary = summary;
    document.getElementById('cartCount').textContent = summary.count;
    document.getElementById('cartTotal').textContent = `₹${summary.subtotal.toLocaleString('en-IN')}`;
    document.querySelector('.checkout-button').disabled = summary.count === 0;
    document.getElementById('cartItems').innerHTML = summary.items.length ? summary.items.map(item => `
        <div class="cart-line">
            <img src="${item.image}" alt="">
            <div class="cart-line-info"><b>${item.name}</b><span>₹${item.price.toLocaleString('en-IN')}</span>
                <div class="quantity-control" aria-label="Quantity for ${item.name}">
                    <button data-cart-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button data-cart-action="increase" data-id="${item.id}" aria-label="Increase quantity">+</button>
                    <button class="remove-item" data-cart-action="remove" data-id="${item.id}">Remove</button>
                </div>
            </div>
        </div>`).join('') : '<p class="cart-empty">Your cart is waiting for something good.</p>';
}

function openCart() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('cartButton').setAttribute('aria-expanded', 'true');
    document.getElementById('cartDrawer').setAttribute('aria-hidden', 'false');
    document.getElementById('closeCart').focus();
}

function closeCart() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('cartButton').setAttribute('aria-expanded', 'false');
    document.getElementById('cartDrawer').setAttribute('aria-hidden', 'true');
}

async function filterProducts(scroll = true) {
    const query = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categorySelect').value;
    const params = new URLSearchParams({ category });
    if (query) params.set('q', query);
    try {
        const filtered = await apiRequest(`/api/products?${params}`);
        heading.textContent = query || category !== 'All' ? `Results for ${query || category}` : 'Popular right now';
        renderProducts(filtered);
        if (scroll) document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showToast(error.message);
    }
}

async function addToCart(productId, replace = false) {
    try {
        const summary = await apiRequest('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ productId, replace })
        });
        updateCart(summary);
        if (replace) openCart();
        const product = summary.items.find(item => item.id === productId);
        showToast(replace ? `${product.name} is ready to buy` : `${product.name} added to cart`);
    } catch (error) {
        showToast(error.message);
    }
}

async function initializeStore() {
    try {
        const summary = await apiRequest('/api/cart');
        const products = await apiRequest('/api/products');
        renderProducts(products);
        updateCart(summary);
    } catch {
        heading.textContent = 'Store temporarily unavailable';
        showToast('Start the storefront server to load products');
    }
}

document.getElementById('searchForm').addEventListener('submit', event => {
    event.preventDefault();
    filterProducts();
});
document.getElementById('categorySelect').addEventListener('change', () => filterProducts());
document.getElementById('clearFilter').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('categorySelect').value = 'All';
    filterProducts(false);
});
document.querySelectorAll('.category-grid button').forEach(button => button.addEventListener('click', () => {
    document.getElementById('categorySelect').value = button.dataset.category;
    filterProducts();
}));
grid.addEventListener('click', event => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    addToCart(Number(button.dataset.id), button.matches('.buy-button'));
});
document.getElementById('cartItems').addEventListener('click', async event => {
    const button = event.target.closest('button[data-cart-action]');
    if (!button) return;
    const item = cartSummary.items.find(entry => entry.id === Number(button.dataset.id));
    if (!item) return;
    try {
        if (button.dataset.cartAction === 'remove') {
            updateCart(await apiRequest(`/api/cart/${item.id}`, { method: 'DELETE' }));
        } else {
            const quantity = item.quantity + (button.dataset.cartAction === 'increase' ? 1 : -1);
            if (quantity < 1) return;
            updateCart(await apiRequest(`/api/cart/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ quantity })
            }));
        }
    } catch (error) {
        showToast(error.message);
    }
});
document.getElementById('cartButton').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCart);
document.getElementById('overlay').addEventListener('click', closeCart);
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCart();
});
document.querySelector('.checkout-button').addEventListener('click', async () => {
    try {
        const order = await apiRequest('/api/orders', { method: 'POST' });
        updateCart({ items: [], count: 0, subtotal: 0 });
        closeCart();
        showToast(`Order ${order.id} placed · ₹${order.subtotal.toLocaleString('en-IN')}`);
    } catch (error) {
        showToast(error.message);
    }
});
document.getElementById('menuToggle').addEventListener('click', event => {
    const nav = document.getElementById('subnav');
    const isOpen = nav.classList.toggle('mobile-open');
    event.currentTarget.setAttribute('aria-expanded', String(isOpen));
});
document.getElementById('locationButton').addEventListener('click', () => showToast('Delivery location: Aligarh 202001'));

initializeStore();
