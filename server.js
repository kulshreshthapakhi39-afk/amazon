const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
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
const carts = new Map();
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8'
};


function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(data));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 10_000) reject(new Error('Request body too large'));
        });
        request.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch {
                reject(new Error('Invalid JSON body'));
            }
        });
        request.on('error', reject);
    });
}

function cartSummary(cart) {
    const items = [...cart.values()];
    return {
        items,
        count: items.reduce((total, item) => total + item.quantity, 0),
        subtotal: items.reduce((total, item) => total + item.price * item.quantity, 0)
    };
}

async function handleApi(request, response, url, cart) {
    if (url.pathname === '/api/products' && request.method === 'GET') {
        const category = url.searchParams.get('category');
        const query = (url.searchParams.get('q') || '').trim().toLowerCase();
        const result = products.filter(product =>
            (!category || category === 'All' || product.category === category) &&
            (!query || `${product.name} ${product.category}`.toLowerCase().includes(query))
        );
        return sendJson(response, 200, result);
    }

    if (url.pathname === '/api/cart' && request.method === 'GET') {
        return sendJson(response, 200, cartSummary(cart));
    }

    if (url.pathname === '/api/cart' && request.method === 'POST') {
        const body = await readJson(request);
        const product = products.find(item => item.id === Number(body.productId));
        if (!product) return sendJson(response, 404, { error: 'Product not found' });
        if (body.replace) cart.clear();
        const existing = cart.get(product.id);
        cart.set(product.id, { ...product, quantity: (existing?.quantity || 0) + 1 });
        return sendJson(response, 200, cartSummary(cart));
    }

    const itemMatch = url.pathname.match(/^\/api\/cart\/(\d+)$/);
    if (itemMatch && request.method === 'PATCH') {
        const productId = Number(itemMatch[1]);
        const item = cart.get(productId);
        const body = await readJson(request);
        const quantity = Number(body.quantity);
        if (!item) return sendJson(response, 404, { error: 'Cart item not found' });
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            return sendJson(response, 400, { error: 'Quantity must be between 1 and 99' });
        }
        cart.set(productId, { ...item, quantity });
        return sendJson(response, 200, cartSummary(cart));
    }

    if (itemMatch && request.method === 'DELETE') {
        cart.delete(Number(itemMatch[1]));
        return sendJson(response, 200, cartSummary(cart));
    }

    if (url.pathname === '/api/orders' && request.method === 'POST') {
        const summary = cartSummary(cart);
        if (!summary.count) return sendJson(response, 400, { error: 'Your cart is empty' });
        const order = {
            id: `AMZ-${randomUUID().slice(0, 8).toUpperCase()}`,
            items: summary.items,
            subtotal: summary.subtotal,
            createdAt: new Date().toISOString()
        };
        cart.clear();
        return sendJson(response, 201, order);
    }

    return sendJson(response, 404, { error: 'API route not found' });
}

function serveStatic(request, response, url) {
    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(root, `.${requestedPath}`);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403);
        return response.end('Forbidden');
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return response.end('Not found');
        }
        response.writeHead(200, {
            'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        response.end(content);
    });
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
        const cookies = Object.fromEntries((request.headers.cookie || '').split(';').map(cookie => {
            const separator = cookie.indexOf('=');
            return separator < 0 ? ['', ''] : [cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim()];
        }));
        let sessionId = cookies.store_session;
        if (!sessionId || !carts.has(sessionId)) {
            sessionId = randomUUID();
            carts.set(sessionId, new Map());
            response.setHeader('Set-Cookie', `store_session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
        }
        try {
            await handleApi(request, response, url, carts.get(sessionId));
        } catch (error) {
            sendJson(response, error.message === 'Invalid JSON body' ? 400 : 413, { error: error.message });
        }
        return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        return response.end();
    }
    serveStatic(request, response, url);
});

server.listen(port, () => console.log(`Storefront running at http://localhost:${port}`));