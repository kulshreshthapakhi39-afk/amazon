const products = [
    { id: 1, name: 'Noise ColorFit Pulse Smart Watch', category: 'Electronics', price: 1599, rating: '4.3', reviews: '12,842', badge: 'Bestseller', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' },
    { id: 2, name: 'Minimal ceramic coffee cup set', category: 'Home', price: 699, rating: '4.6', reviews: '3,216', badge: 'Popular', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80' },
    { id: 3, name: 'Everyday canvas sneakers', category: 'Fashion', price: 1299, rating: '4.2', reviews: '8,091', badge: '', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
    { id: 4, name: 'Vitamin C brightening face serum', category: 'Beauty', price: 449, rating: '4.5', reviews: '5,740', badge: 'Deal', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80' },
    { id: 5, name: 'Portable wireless speaker', category: 'Electronics', price: 2199, rating: '4.4', reviews: '1,908', badge: '', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80' },
    { id: 6, name: 'Soft cotton cushion cover', category: 'Home', price: 349, rating: '4.1', reviews: '2,404', badge: '', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80' },
    { id: 7, name: 'Relaxed fit linen shirt', category: 'Fashion', price: 899, rating: '4.3', reviews: '4,102', badge: 'New', image: 'https://images.unsplash.com/photo-1603252110481-7ba873bf42ab?auto=format&fit=crop&w=600&q=80' },
    { id: 8, name: 'Hydrating lip balm trio', category: 'Beauty', price: 299, rating: '4.7', reviews: '6,680', badge: '', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80' }
];
let cart = [];
const grid = document.getElementById('productGrid');
const heading = document.getElementById('productHeading');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');

function renderProducts(list = products) {
    grid.innerHTML = list.map(product => `<article class="product-card"><div class="product-image">${product.badge ? `<span class="badge">${product.badge}</span>` : ''}<img src="${product.image}" alt="${product.name}" loading="lazy"></div><div class="product-info"><h3>${product.name}</h3><div class="rating">★★★★★ <span>${product.rating} · ${product.reviews}</span></div><p class="price"><small>₹</small>${product.price.toLocaleString('en-IN')}</p><button class="add-button" data-id="${product.id}">Add to cart</button></div></article>`).join('');
    emptyState.style.display = list.length ? 'none' : 'block';
}
function showToast(message) { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2200); }
function updateCart() { document.getElementById('cartCount').textContent = cart.length; document.getElementById('cartTotal').textContent = `₹${cart.reduce((sum, item) => sum + item.price, 0).toLocaleString('en-IN')}`; document.getElementById('cartItems').innerHTML = cart.length ? cart.map(item => `<div class="cart-line"><img src="${item.image}" alt=""><div><b>${item.name}</b><span>₹${item.price.toLocaleString('en-IN')}</span></div></div>`).join('') : '<p class="empty-state" style="display:block">Your cart is waiting for something good.</p>'; }
function filterProducts() { const query = document.getElementById('searchInput').value.toLowerCase().trim(); const category = document.getElementById('categorySelect').value; const filtered = products.filter(product => (category === 'All' || product.category === category) && (!query || `${product.name} ${product.category}`.toLowerCase().includes(query))); heading.textContent = query || category !== 'All' ? `Results for ${query || category}` : 'Popular right now'; renderProducts(filtered); document.getElementById('products').scrollIntoView({ behavior: 'smooth' }); }

renderProducts(); updateCart();
document.getElementById('searchForm').addEventListener('submit', event => { event.preventDefault(); filterProducts(); });
document.getElementById('categorySelect').addEventListener('change', filterProducts);
document.getElementById('clearFilter').addEventListener('click', () => { document.getElementById('searchInput').value = ''; document.getElementById('categorySelect').value = 'All'; heading.textContent = 'Popular right now'; renderProducts(); });
document.querySelectorAll('.category-grid button').forEach(button => button.addEventListener('click', () => { document.getElementById('categorySelect').value = button.dataset.category; filterProducts(); }));
grid.addEventListener('click', event => { if (!event.target.matches('.add-button')) return; const product = products.find(item => item.id === Number(event.target.dataset.id)); cart.push(product); updateCart(); showToast(`${product.name} added to cart`); });
document.getElementById('cartButton').addEventListener('click', () => { document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('show'); });
function closeCart() { document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('show'); }
document.getElementById('closeCart').addEventListener('click', closeCart); document.getElementById('overlay').addEventListener('click', closeCart);
document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('subnav').classList.toggle('mobile-open'));
document.getElementById('locationButton').addEventListener('click', () => showToast('Delivery location: Aligarh 202001'));
