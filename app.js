// Live Realtime Firebase Engine Cloud Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCG9PiY1pdZKm0-Z9raOWQfx8k3YL50n4k",
  authDomain: "flowers-to-doorstep.firebaseapp.com",
  databaseURL: "https://flowers-to-doorstep-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "flowers-to-doorstep",
  storageBucket: "flowers-to-doorstep.firebasestorage.app",
  messagingSenderId: "849984447371",
  appId: "1:849984447371:web:63ea8c98abec5eb218858e",
  measurementId: "G-Y02LJJHGHZ"
};

const OWNER_WHATSAPP = "919704978710";
const OWNER_UPI_ID = "6302338300@axl";
const OWNER_UPI_NAME = "Flowers to Doorstep";

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const FALLBACK_SEEDS = [
    { id: "prod_1", name: 'Rose', price: 80, unit: '100 grams loose', category: 'loose flowers', stock: 15, desc: 'Fresh bright red aromatic loose roses for daily pooja arrangements.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400' },
    { id: "prod_2", name: 'White Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 5, desc: 'Crisp handpicked traditional white chrysanthemums.', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=400' },
    { id: "prod_3", name: 'Yellow Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 12, desc: 'Bright yellow auspicious blooms ideal for home decoration festive setups.', img: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=400' },
    { id: "prod_4", name: 'Small Jasmine Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 8, desc: 'Sana Jaji thin-spun tight weave fragrant garland strands.', img: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?q=80&w=400' },
    { id: "prod_5", name: 'Shevanti Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 4, desc: 'Dense thick yellow chrysanthemums woven tightly for deity frames.', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400' }
];

let products = [];
let cart = {};
let selectedCategory = null;
let currentView = 'customer';
let isOwnerAuthenticated = false;

db.ref('catalog').once('value', snap => {
    if (!snap.exists()) {
        const seedMap = {};
        FALLBACK_SEEDS.forEach(p => { seedMap[p.id] = p; });
        db.ref('catalog').set(seedMap);
    }
});

db.ref('catalog').on('value', snap => {
    try {
        const data = snap.val();
        if (data) {
            products = Object.keys(data)
                .filter(key => data[key] !== null && data[key] !== undefined)
                .map(key => ({ id: key, ...data[key] }));
        } else {
            products = [];
        }
        renderProducts();
        if (isOwnerAuthenticated && currentView === 'owner') showOwnerDashboard();
    } catch (e) {
        console.error("Data Sync Error Caught: ", e);
    }
});

db.ref('orders').on('value', snap => {
    if (isOwnerAuthenticated && currentView === 'owner') {
        renderOrderHistory(snap.val());
    }
});

setTimeout(() => {
    const bg = document.getElementById('bg-image');
    if (bg) bg.style.backgroundImage = "url('images/hero-background.jpg')";
}, 500);

window.selectCategory = function(category) {
    selectedCategory = (selectedCategory === category) ? null : category;
    const bg = document.getElementById('bg-image');
    if (bg) {
        bg.className = !selectedCategory
            ? "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-100 opacity-100"
            : "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-105 opacity-20 blur-md";
    }
    updateNavUI();
    renderProducts();
};

function updateNavUI() {
    ['garlands', 'loose', 'others'].forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        if (!btn) return;
        const catName = id === 'loose' ? 'loose flowers' : id;
        btn.className = (selectedCategory === catName)
            ? "flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 bg-amber-400 text-slate-950 shadow-lg"
            : "flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 text-white hover:bg-white/5";
    });
}

function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.innerHTML = '';

    if (!selectedCategory) {
        container.className = "block text-center py-16 bg-black/20 backdrop-blur-xs rounded-2xl border border-white/5 p-6 mb-36";
        container.innerHTML = `<p class="text-xl font-medium text-amber-200">Welcome to Our Store</p>
                               <p class="text-gray-400 text-sm mt-2 max-w-md mx-auto">Select a product category tab from the navigation bar above to browse our live inventory.</p>`;
        return;
    }

    container.className = "grid grid-cols-1 sm:grid-cols-2 gap-6 mb-36";
    const filtered = products.filter(p => p && p.category === selectedCategory);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 italic text-sm py-8">No products found inside this section currently.</p>`;
        return;
    }

    filtered.forEach(product => {
        const cartQty = cart[product.id] || 0;
        const card = document.createElement('div');
        card.className = "bg-slate-900/80 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between shadow-xl relative";

        let actionButtons = Number(product.stock) <= 0
            ? `<span class="text-gray-500 font-medium text-xs bg-white/5 px-3 py-1.5 rounded-md">Sold Out Today</span>`
            : `<div class="flex items-center gap-2">
                    ${cartQty > 0 ? `<button onclick="addToCart('${product.id}', -1)" class="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-lg font-bold flex items-center justify-center border border-white/20">-</button>` : ''}
                    ${cartQty > 0 ? `<span class="font-bold text-sm px-1">${cartQty}</span>` : ''}
                    <button onclick="addToCart('${product.id}', 1)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition">
                        ${cartQty > 0 ? 'Add More' : 'Add to Cart'}
                    </button>
               </div>`;

        card.innerHTML = `
            <div class="relative h-48 bg-slate-800">
                <img src="${product.img || 'images/placeholder.jpg'}" alt="${product.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400';">
                ${Number(product.stock) <= 0 ? `<div class="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><span class="bg-red-600 text-white font-black px-4 py-2 rounded text-xs tracking-widest uppercase border border-red-400">OUT OF STOCK</span></div>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div class="space-y-1">
                    <h3 class="font-bold text-lg text-white leading-tight">${product.name}</h3>
                    <p class="text-amber-400/90 text-xs font-semibold">${product.unit}</p>
                    <p class="text-gray-400 text-xs font-normal line-clamp-2 pt-1 border-t border-white/5">${product.desc || 'Fresh daily morning arrivals.'}</p>
                </div>
                <div class="flex items-center justify-between mt-4 pt-2 border-t border-white/5">
                    <span class="text-xl font-black text-amber-400">₹${product.price}</span>
                    ${actionButtons}
                </div>
            </div>`;
        container.appendChild(card);
    });
}

window.addToCart = function(productId, change) {
    const item = products.find(p => p && p.id === productId);
    const currentQty = cart[productId] || 0;
    const targetQty = currentQty + change;

    if (targetQty > Number(item.stock)) {
        alert(`⚠️ Cannot add more! Only ${item.stock} units remain available in stock.`);
        return;
    }

    if (targetQty <= 0) delete cart[productId];
    else cart[productId] = targetQty;

    renderProducts();
    updateBasketFab();
};

function cartEntries() {
    return Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find(p => p && p.id === id), qty }))
        .filter(e => e.product);
}

function cartSubtotal() {
    return cartEntries().reduce((s, e) => s + Number(e.product.price) * e.qty, 0);
}

function updateBasketFab() {
    const fab = document.getElementById('basket-fab');
    const entries = cartEntries();
    const count = entries.reduce((s, e) => s + e.qty, 0);
    const subtotal = cartSubtotal();

    if (count === 0) {
        fab.classList.add('hidden');
        fab.classList.remove('flex');
        return;
    }
    fab.classList.remove('hidden');
    fab.classList.add('flex');
    document.getElementById('basket-count').textContent = count;
    document.getElementById('basket-total').textContent = subtotal;
}

window.openBasket = function() {
    renderBasketScreen();
    document.getElementById('cart-overlay').classList.remove('hidden');
    document.getElementById('cart-overlay').classList.add('flex');
    document.getElementById('basket-screen').classList.remove('hidden');
    document.getElementById('checkout-screen').classList.add('hidden');
};

window.closeCartOverlay = function() {
    document.getElementById('cart-overlay').classList.add('hidden');
    document.getElementById('cart-overlay').classList.remove('flex');
};

window.goToCheckout = function() {
    document.getElementById('basket-screen').classList.add('hidden');
    document.getElementById('checkout-screen').classList.remove('hidden');
    validateAreaSelection();
};

window.backToBasket = function() {
    document.getElementById('checkout-screen').classList.add('hidden');
    document.getElementById('basket-screen').classList.remove('hidden');
    renderBasketScreen();
};

function renderBasketScreen() {
    const entries = cartEntries();
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = '';

    let subtotal = 0;
    entries.forEach(e => {
        subtotal += Number(e.product.price) * e.qty;
        const row = document.createElement('div');
        row.className = "flex justify-between items-center text-sm bg-white/5 p-2.5 rounded-lg border border-white/5";
        row.innerHTML = `
            <div class="flex items-center gap-2">
                <button onclick="addToCart('${e.product.id}', -1)" class="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg font-bold flex items-center justify-center border border-white/20 text-xs">-</button>
                <span class="font-bold text-white">${e.qty}</span>
                <button onclick="addToCart('${e.product.id}', 1)" class="bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg font-bold flex items-center justify-center border border-white/20 text-xs">+</button>
                <div class="ml-2">
                    <div class="font-semibold text-white">${e.product.name}</div>
                    <div class="text-gray-400 text-xs">₹${e.product.price} each</div>
                </div>
            </div>
            <span class="font-bold text-amber-400">₹${e.product.price * e.qty}</span>`;
        itemsContainer.appendChild(row);
        row.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => renderBasketScreen()));
    });

    const promoBanner = document.getElementById('promo-banner');
    if (subtotal < 200) {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-amber-500/10 border border-amber-500/30 text-amber-300";
        promoBanner.innerHTML = `🛒 Your subtotal is ₹${subtotal}. <span class="underline font-bold text-amber-400">Add ₹${200 - subtotal} more</span> for FREE delivery!`;
    } else {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        promoBanner.innerHTML = `🎉 Splendid! Your order qualifies for Free Doorstep Delivery.`;
    }

    const fee = subtotal < 200 ? 20 : 0;
    document.getElementById('pricing-summary').innerText = `Subtotal: ₹${subtotal} | Delivery: ${fee > 0 ? `₹${fee}` : 'FREE'}`;
    document.getElementById('cart-total').innerText = `₹${subtotal + fee}`;

    updateBasketFab();
}

window.validateAreaSelection = function() {
    const area = document.getElementById('delivery-area').value;
    const btn = document.getElementById('checkout-btn');
    const addressInput = document.getElementById('delivery-address');

    if (area === 'outside') {
        btn.innerText = 'UNSERVICEABLE AREA';
        btn.disabled = true;
        btn.className = "w-full bg-red-600 text-white py-4 rounded-xl font-black tracking-widest uppercase text-sm cursor-not-allowed mt-2";
        addressInput.disabled = true;
    } else {
        btn.innerText = 'CONFIRM ORDER';
        btn.disabled = false;
        btn.className = "w-full bg-amber-400 hover:bg-amber-500 text-slate-950 py-4 rounded-xl font-black tracking-widest uppercase text-sm transition shadow-lg mt-2";
        addressInput.disabled = false;
    }
};

window.revealUpiId = function() {
    const el = document.getElementById('upi-id-display');
    el.textContent = OWNER_UPI_ID;
    el.classList.remove('hidden');
};

window.confirmOrder = function() {
    const area = document.getElementById('delivery-area').value;
    const address = document.getElementById('delivery-address').value.trim();
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (!name) return alert('⚠️ Please provide your name.');
    if (!phone || phone.length < 10) return alert('⚠️ A valid 10-digit WhatsApp number is needed.');
    if (area === 'outside') return alert('❌ Sorry, delivery is bound to Gowlidoddi layouts only.');
    if (!address) return alert('⚠️ Complete local housing street address is required.');

    const entries = cartEntries();
    if (entries.length === 0) return alert('⚠️ Your basket is empty.');

    let subtotal = 0;
    let whatsappOrderList = "";
    const updates = {};
    const orderItems = [];

    for (const e of entries) {
        const prod = e.product;
        const qty = e.qty;
        const currentStock = Number(prod.stock);
        if (qty > currentStock) return alert(`🚨 Inventory conflict for "${prod.name}". Only ${currentStock} left.`);

        subtotal += Number(prod.price) * qty;
        updates[`/catalog/${prod.id}/stock`] = currentStock - qty;
        whatsappOrderList += `- ${prod.name} (${prod.unit}) x ${qty} = ₹${Number(prod.price) * qty}\n`;
        orderItems.push({ name: prod.name, qty, price: Number(prod.price) });
    }

    const deliveryFee = subtotal < 200 ? 20 : 0;
    const total = subtotal + deliveryFee;

    const logOrderData = {
        name, phone, items: orderItems, address,
        subtotal, deliveryFee, total,
        paymentMethod,
        status: paymentMethod === 'UPI' ? 'UPI Payment Initiated - Confirm receipt' : 'Confirmed - Cash on Delivery',
        timestamp: new Date().toLocaleString()
    };

    if (paymentMethod === 'UPI') {
        const upiLink = `upi://pay?pa=${encodeURIComponent(OWNER_UPI_ID)}&pn=${encodeURIComponent(OWNER_UPI_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent('Order - ' + name)}`;
        document.getElementById('upi-fallback').classList.remove('hidden');
        window.location.href = upiLink;
    }

    db.ref().update(updates).then(() => {
        db.ref('orders').push(logOrderData);

        const textPayload = `New Order - Flowers To Doorstep\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n\nOrder:\n${whatsappOrderList}\nSubtotal: ₹${subtotal}\nDelivery: ${deliveryFee > 0 ? `₹${deliveryFee}` : 'FREE'}\nTotal: ₹${total}\nPayment: ${paymentMethod}${paymentMethod === 'UPI' ? ' (please confirm receipt before dispatch)' : ''}`;

        cart = {};
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('delivery-address').value = '';
        selectedCategory = null;
        updateNavUI();
        renderProducts();
        updateBasketFab();
        closeCartOverlay();

        setTimeout(() => {
            window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(textPayload)}`, '_blank');
        }, paymentMethod === 'UPI' ? 1200 : 0);
    });
};

window.toggleView = function() {
    const customerView = document.getElementById('customer-view');
    const ownerView = document.getElementById('owner-view');
    const toggleBtn = document.getElementById('view-toggle-btn');
    if (!customerView || !ownerView || !toggleBtn) return;

    if (currentView === 'customer') {
        currentView = 'owner';
        customerView.classList.replace('block', 'hidden');
        ownerView.classList.replace('hidden', 'block');
        toggleBtn.innerText = 'Go To Storefront';
        if (isOwnerAuthenticated) showOwnerDashboard();
    } else {
        currentView = 'customer';
        customerView.classList.replace('hidden', 'block');
        ownerView.classList.replace('block', 'hidden');
        toggleBtn.innerText = 'Switch to Owner Panel';
    }
};

window.verifyOwnerPassword = function() {
    const inputPass = document.getElementById('owner-password').value;
    if (inputPass === 'admin123') {
        isOwnerAuthenticated = true;
        document.getElementById('owner-auth').classList.replace('block', 'hidden');
        showOwnerDashboard();
        db.ref('orders').once('value', snap => renderOrderHistory(snap.val()));
    } else {
        alert('❌ Security Credentials Invalid!');
    }
};

function showOwnerDashboard() {
    const dashboard = document.getElementById('owner-dashboard');
    if (dashboard) dashboard.classList.remove('hidden');
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        if (!p) return;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td class="p-3">
                <div class="font-bold text-white">${p.name}</div>
                <div class="text-xs text-amber-400 font-semibold mb-1">${p.unit}</div>
                <input type="text" value="${p.desc || ''}" data-field="desc" placeholder="Add description..." class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-400 focus:outline-none">
                <input type="text" value="${p.img || ''}" data-field="img" placeholder="Image path e.g. images/rose.jpg" class="w-full mt-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3">
                <input type="number" value="${p.price}" data-field="price" class="w-20 bg-slate-950 border border-white/10 rounded p-1.5 font-bold text-center text-emerald-400 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3">
                <input type="number" value="${p.stock}" data-field="stock" class="w-20 bg-slate-950 border border-white/10 rounded p-1.5 font-bold text-center text-amber-400 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3 text-center space-y-1 flex flex-col items-center">
                <button data-action="save" class="w-full text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-500 px-2 py-1.5 rounded transition">Save</button>
                <button data-action="delete" class="w-full text-xs font-bold text-red-400 hover:text-red-500 bg-red-500/10 px-2 py-1.5 rounded border border-red-500/20 transition">Remove</button>
            </td>`;
        tbody.appendChild(tr);
    });

    tbody.onclick = function(e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const row = btn.closest('tr');
        const id = row.dataset.id;

        if (btn.dataset.action === 'delete') {
            deleteProduct(id);
            return;
        }

        if (btn.dataset.action === 'save') {
            const desc = row.querySelector('[data-field="desc"]').value.trim();
            const img = row.querySelector('[data-field="img"]').value.trim();
            const price = Number(row.querySelector('[data-field="price"]').value);
            const stock = Number(row.querySelector('[data-field="stock"]').value);

            if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
                alert('⚠️ Price and stock must be valid numbers.');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Saving…';

            db.ref(`catalog/${id}`).update({ desc, img, price, stock })
                .then(() => {
                    btn.textContent = 'Saved ✓';
                    setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 1200);
                })
                .catch((err) => {
                    alert('❌ Save failed: ' + err.message);
                    btn.textContent = 'Save';
                    btn.disabled = false;
                });
        }
    };
}

window.addNewProduct = function() {
    try {
        const nameEl = document.getElementById('new-prod-name');
        const catEl = document.getElementById('new-prod-category');
        const priceEl = document.getElementById('new-prod-price');
        const unitEl = document.getElementById('new-prod-unit');
        const stockEl = document.getElementById('new-prod-stock');
        const imgEl = document.getElementById('new-prod-img');
        const descEl = document.getElementById('new-prod-desc');

        const name = nameEl ? nameEl.value.trim() : '';
        const category = catEl ? catEl.value : 'garlands';
        const price = priceEl ? priceEl.value : '';
        const unit = unitEl ? unitEl.value.trim() : '';
        const stock = stockEl ? stockEl.value : '';
        const img = imgEl ? imgEl.value.trim() : '';
        const desc = descEl ? descEl.value.trim() : '';

        if (!name || !price || !unit || !stock) {
            alert('⚠️ Please fill out Name, Price, Unit, and Stock values.');
            return;
        }

        const uniqueId = "prod_" + Date.now().toString();
        const cleanPayload = {
            id: uniqueId, name, category, price: Number(price), unit, stock: Number(stock),
            img: img || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400',
            desc: desc || 'Fresh daily morning arrivals.'
        };

        db.ref(`catalog/${uniqueId}`).set(cleanPayload)
            .then(() => {
                alert('✨ Product successfully registered to live database!');
                [nameEl, priceEl, unitEl, stockEl, imgEl, descEl].forEach(el => { if (el) el.value = ''; });
            })
            .catch((error) => {
                alert('❌ Firebase Sync Error: ' + error.message);
            });
    } catch (err) {
        alert('❌ Caught JavaScript Mismatch Error: ' + err.message);
    }
};

window.deleteProduct = function(productId) {
    if (confirm('🗑️ Remove this item from database?')) {
        db.ref(`catalog/${productId}`).remove();
    }
};

function renderOrderHistory(ordersData) {
    const container = document.getElementById('orders-history-container');
    if (!container) return;
    container.innerHTML = '';
    if (!ordersData) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No entries saved yet.</p>`;
        return;
    }
    Object.values(ordersData).reverse().forEach(order => {
        const div = document.createElement('div');
        div.className = "bg-slate-950 border border-white/10 rounded-xl p-4 space-y-2 border-l-4 border-l-emerald-500 shadow-lg";
        let itemsList = order.items.map(i => `<li class="text-xs text-gray-300">• ${i.name} (Qty: ${i.qty}) - ₹${i.price * i.qty}</li>`).join('');
        div.innerHTML = `
            <div class="flex justify-between items-center text-xs text-gray-400">
                <span>📅 ${order.timestamp}</span>
                <span class="text-emerald-400 font-bold font-mono">Total: ₹${order.total}</span>
            </div>
            <div class="text-sm font-bold text-white">👤 ${order.name || 'Customer'} (${order.phone || 'N/A'})</div>
            <div class="text-xs text-amber-400">${order.paymentMethod || ''} — ${order.status || ''}</div>
            <div class="text-xs text-emerald-400">📍 ${order.address}</div>
            <ul class="space-y-1 bg-white/5 p-2 rounded-lg mt-1">${itemsList}</ul>`;
        container.appendChild(div);
    });
}
