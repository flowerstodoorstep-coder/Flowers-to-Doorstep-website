const FALLBACK_SEEDS = [
    { id: "prod_1", name: 'Rose', price: 80, unit: '100 grams loose', category: 'loose flowers', stock: 15, desc: 'Fresh bright red aromatic loose roses for daily pooja arrangements.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400' },
    { id: "prod_2", name: 'White Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 5, desc: 'Crisp handpicked traditional white chrysanthemums.', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=400' },
    { id: "prod_3", name: 'Yellow Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 12, desc: 'Bright yellow auspicious blooms ideal for home decoration festive setups.', img: 'https://images.unsplash.com/photo-1596436889106-be35e849f974?q=80&w=400' },
    { id: "prod_4", name: 'Small Jasmine Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 8, desc: 'Sana Jaji thin-spun tight weave fragrant garland strands.', img: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?q=80&w=400' },
    { id: "prod_5", name: 'Shevanti Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 4, desc: 'Dense thick yellow chrysanthemums woven tightly for deity frames.', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400' }
];

let products = [];
let cart = {};
let selectedCategory = 'all';

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
        products = data
            ? Object.keys(data).filter(k => data[k]).map(k => ({ id: k, ...data[k] }))
            : [];
        renderProducts();
    } catch (e) { console.error(e); }
});

setTimeout(() => {
    const bg = document.getElementById('bg-image');
    if (bg) bg.style.backgroundImage = "url('images/hero-background.jpg')";
}, 500);

/* ---------------- Category tabs ---------------- */
window.selectCategory = function(category) {
    selectedCategory = category;
    const bg = document.getElementById('bg-image');
    if (bg) {
        bg.className = "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-105 opacity-20 blur-md";
    }
    updateNavUI();
    renderProducts();
};

function updateNavUI() {
    document.querySelectorAll('.cat-tab').forEach(btn => {
        const isActive = btn.dataset.cat === selectedCategory;
        btn.className = isActive
            ? "cat-tab flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 bg-amber-400 text-slate-950 shadow-lg"
            : "cat-tab flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 text-white hover:bg-white/5";
    });
}

/* ---------------- Product grid ---------------- */
function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    container.className = "grid grid-cols-1 sm:grid-cols-2 gap-6 mb-36";

    const filtered = selectedCategory === 'all' ? products : products.filter(p => p && p.category === selectedCategory);

    if (filtered.length === 0) {
        container.innerHTML = `<p class="col-span-full text-center text-gray-500 italic text-sm py-8">No products found here yet.</p>`;
        return;
    }

    container.innerHTML = '';
    filtered.forEach(product => {
        const cartQty = cart[product.id] || 0;
        const card = document.createElement('div');
        card.className = "bg-slate-900/80 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between shadow-xl relative";

        let actionButtons = Number(product.stock) <= 0
            ? `<span class="text-gray-500 font-medium text-xs bg-white/5 px-3 py-1.5 rounded-md">Sold Out Today</span>`
            : `<div class="flex items-center gap-2" onclick="event.stopPropagation()">
                    ${cartQty > 0 ? `<button onclick="addToCart('${product.id}', -1)" class="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-lg font-bold flex items-center justify-center border border-white/20">-</button>` : ''}
                    ${cartQty > 0 ? `<span class="font-bold text-sm px-1">${cartQty}</span>` : ''}
                    <button onclick="addToCart('${product.id}', 1)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition">
                        ${cartQty > 0 ? 'Add More' : 'Add to Cart'}
                    </button>
               </div>`;

        card.innerHTML = `
            <div class="relative aspect-[3/4] bg-slate-800 cursor-pointer" onclick="openProductModal('${product.id}')">
                <img src="${product.img || 'images/placeholder.jpg'}" alt="${product.name}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400';">
                ${Number(product.stock) <= 0 ? `<div class="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm"><span class="bg-red-600 text-white font-black px-4 py-2 rounded text-xs tracking-widest uppercase border border-red-400">OUT OF STOCK</span></div>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div class="space-y-1 cursor-pointer" onclick="openProductModal('${product.id}')">
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

/* ---------------- Product detail modal ---------------- */
window.openProductModal = function(productId) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const cartQty = cart[p.id] || 0;
    const modal = document.getElementById('product-modal');
    document.getElementById('product-modal-body').innerHTML = `
        <img src="${p.img || 'images/placeholder.jpg'}" alt="${p.name}" class="w-full aspect-[3/4] object-cover bg-slate-800 rounded-xl mb-4" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400';">
        <h2 class="text-2xl font-black text-white">${p.name}</h2>
        <p class="text-amber-400 text-sm font-semibold mt-1">${p.unit}</p>
        <p class="text-gray-300 text-sm mt-3 leading-relaxed">${p.desc || 'Fresh daily morning arrivals.'}</p>
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <span class="text-2xl font-black text-amber-400">₹${p.price}</span>
            ${Number(p.stock) <= 0
                ? `<span class="text-gray-500 font-medium text-xs bg-white/5 px-3 py-2 rounded-md">Sold Out Today</span>`
                : `<div class="flex items-center gap-2" id="modal-qty-controls">
                        ${cartQty > 0 ? `<button onclick="addToCart('${p.id}', -1); openProductModal('${p.id}')" class="bg-white/10 hover:bg-white/20 w-9 h-9 rounded-lg font-bold border border-white/20">-</button>` : ''}
                        ${cartQty > 0 ? `<span class="font-bold px-1">${cartQty}</span>` : ''}
                        <button onclick="addToCart('${p.id}', 1); openProductModal('${p.id}')" class="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 rounded-lg font-bold text-sm">${cartQty > 0 ? 'Add More' : 'Add to Cart'}</button>
                   </div>`}
        </div>`;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeProductModal = function() {
    const modal = document.getElementById('product-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

/* ---------------- Cart ---------------- */
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
    return Object.entries(cart).map(([id, qty]) => ({ product: products.find(p => p && p.id === id), qty })).filter(e => e.product);
}
function cartSubtotal() {
    return cartEntries().reduce((s, e) => s + Number(e.product.price) * e.qty, 0);
}

function updateBasketFab() {
    const fab = document.getElementById('basket-fab');
    const entries = cartEntries();
    const count = entries.reduce((s, e) => s + e.qty, 0);
    if (count === 0) { fab.classList.add('hidden'); fab.classList.remove('flex'); return; }
    fab.classList.remove('hidden'); fab.classList.add('flex');
    document.getElementById('basket-count').textContent = count;
    document.getElementById('basket-total').textContent = cartSubtotal();
}

window.openBasket = function() {
    renderBasketScreen();
    const overlay = document.getElementById('cart-overlay');
    overlay.classList.remove('hidden'); overlay.classList.add('flex');
    document.getElementById('basket-screen').classList.remove('hidden');
    document.getElementById('checkout-screen').classList.add('hidden');
};
window.closeCartOverlay = function() {
    const overlay = document.getElementById('cart-overlay');
    overlay.classList.add('hidden'); overlay.classList.remove('flex');
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
                <button data-id="${e.product.id}" data-d="-1" class="qbtn bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg font-bold border border-white/20 text-xs">-</button>
                <span class="font-bold text-white">${e.qty}</span>
                <button data-id="${e.product.id}" data-d="1" class="qbtn bg-white/10 hover:bg-white/20 w-7 h-7 rounded-lg font-bold border border-white/20 text-xs">+</button>
                <div class="ml-2"><div class="font-semibold text-white">${e.product.name}</div><div class="text-gray-400 text-xs">₹${e.product.price} each</div></div>
            </div>
            <span class="font-bold text-amber-400">₹${e.product.price * e.qty}</span>`;
        itemsContainer.appendChild(row);
    });
    itemsContainer.querySelectorAll('.qbtn').forEach(btn => btn.addEventListener('click', () => {
        addToCart(btn.dataset.id, Number(btn.dataset.d));
        renderBasketScreen();
    }));

    const pricing = calcPricing(subtotal);
    const promoBanner = document.getElementById('promo-banner');
    if (!pricing.qualifies) {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-amber-500/10 border border-amber-500/30 text-amber-300";
        promoBanner.innerHTML = `🛒 Add ₹${FREE_DELIVERY_THRESHOLD - subtotal} more to unlock <b>FREE delivery + 10% OFF</b>!`;
    } else {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        promoBanner.innerHTML = `🎉 You've unlocked FREE delivery + 10% OFF!`;
    }

    document.getElementById('pricing-summary').innerText = `Subtotal: ₹${subtotal}${pricing.discount ? ` | 10% off: -₹${pricing.discount}` : ''} | Delivery: ${pricing.deliveryFee ? `₹${pricing.deliveryFee}` : 'FREE'}`;
    document.getElementById('cart-total').innerText = `₹${pricing.total}`;
    updateBasketFab();
}

window.validateAreaSelection = function() {
    const area = document.getElementById('delivery-area').value;
    const btn = document.getElementById('checkout-btn');
    const addressInput = document.getElementById('delivery-address');
    if (area === 'outside') {
        btn.innerText = 'UNSERVICEABLE AREA'; btn.disabled = true;
        btn.className = "w-full bg-red-600 text-white py-4 rounded-xl font-black tracking-widest uppercase text-sm cursor-not-allowed mt-2";
        addressInput.disabled = true;
    } else {
        btn.innerText = 'CONFIRM ORDER'; btn.disabled = false;
        btn.className = "w-full bg-amber-400 hover:bg-amber-500 text-slate-950 py-4 rounded-xl font-black tracking-widest uppercase text-sm transition shadow-lg mt-2";
        addressInput.disabled = false;
    }
};

window.revealUpiId = function() {
    const el = document.getElementById('upi-id-display');
    el.textContent = OWNER_UPI_ID;
    el.classList.remove('hidden');
};

/* ---------------- Confirm order ---------------- */
window.confirmOrder = function() {
    const area = document.getElementById('delivery-area').value;
    const address = document.getElementById('delivery-address').value.trim();
    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const notes = document.getElementById('order-notes').value.trim();
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;

    if (!name) return alert('⚠️ Please provide your name.');
    if (!phone || phone.length < 10) return alert('⚠️ A valid 10-digit WhatsApp number is needed.');
    if (area === 'outside') return alert('❌ Sorry, delivery is bound to Gowlidoddi layouts only.');
    if (!address) return alert('⚠️ Complete local housing street address is required.');

    const entries = cartEntries();
    if (entries.length === 0) return alert('⚠️ Your basket is empty.');

    let subtotal = 0, whatsappOrderList = "";
    const updates = {}, orderItems = [];
    for (const e of entries) {
        const prod = e.product, qty = e.qty, currentStock = Number(prod.stock);
        if (qty > currentStock) return alert(`🚨 Only ${currentStock} of "${prod.name}" left.`);
        subtotal += Number(prod.price) * qty;
        updates[`/catalog/${prod.id}/stock`] = currentStock - qty;
        whatsappOrderList += `- ${prod.name} (${prod.unit}) x ${qty} = ₹${Number(prod.price) * qty}\n`;
        orderItems.push({ name: prod.name, qty, price: Number(prod.price) });
    }

    const pricing = calcPricing(subtotal);
    const deliveryDate = getExpectedDeliveryDate();

    const logOrderData = {
        name, phone, items: orderItems, address, notes,
        subtotal, discount: pricing.discount, deliveryFee: pricing.deliveryFee, total: pricing.total,
        paymentMethod,
        status: 'Placed',
        deliveryDate,
        timestamp: new Date().toLocaleString('en-IN')
    };

    if (paymentMethod === 'UPI') {
        const upiLink = `upi://pay?pa=${encodeURIComponent(OWNER_UPI_ID)}&pn=${encodeURIComponent(OWNER_UPI_NAME)}&am=${pricing.total}&cu=INR&tn=${encodeURIComponent('Order - ' + name)}`;
        document.getElementById('upi-fallback').classList.remove('hidden');
        // Top-level navigation is what reliably triggers Android's UPI app chooser
        // with the amount/payee pre-filled — window.open() often fails silently.
        window.location.href = upiLink;
    }

    db.ref().update(updates).then(() => {
        db.ref('orders').push(logOrderData);

        let textPayload = `New Order - Flowers To Doorstep\n\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\n`;
        if (notes) textPayload += `Notes: ${notes}\n`;
        textPayload += `\nOrder:\n${whatsappOrderList}\nSubtotal: ₹${subtotal}\n`;
        if (pricing.discount) textPayload += `Discount (10%): -₹${pricing.discount}\n`;
        textPayload += `Delivery: ${pricing.deliveryFee ? `₹${pricing.deliveryFee}` : 'FREE'}\nTotal: ₹${pricing.total}\nPayment: ${paymentMethod}\nExpected Delivery: ${deliveryDate}`;

        cart = {};
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('delivery-address').value = '';
        document.getElementById('order-notes').value = '';
        renderProducts();
        updateBasketFab();
        closeCartOverlay();

        window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(textPayload)}`, '_blank');

        showOrderConfirmedPopup(deliveryDate);
    });
};

function showOrderConfirmedPopup(deliveryDate) {
    document.getElementById('confirmation-delivery-date').textContent = deliveryDate;
    const modal = document.getElementById('order-confirmed-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
}
window.closeConfirmedModal = function() {
    const modal = document.getElementById('order-confirmed-modal');
    modal.classList.add('hidden'); modal.classList.remove('flex');
};

/* ---------------- My Orders (lookup by phone) ---------------- */
window.openMyOrders = function() {
    const modal = document.getElementById('my-orders-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    document.getElementById('my-orders-results').innerHTML = '';
};
window.closeMyOrders = function() {
    const modal = document.getElementById('my-orders-modal');
    modal.classList.add('hidden'); modal.classList.remove('flex');
};
window.searchMyOrders = function() {
    const phone = document.getElementById('my-orders-phone').value.trim();
    const results = document.getElementById('my-orders-results');
    if (!phone) { results.innerHTML = `<p class="text-gray-400 text-sm italic">Enter the phone number you used while ordering.</p>`; return; }
    results.innerHTML = `<p class="text-gray-400 text-sm italic">Searching…</p>`;

    db.ref('orders').orderByChild('phone').equalTo(phone).once('value', snap => {
        const data = snap.val();
        if (!data) { results.innerHTML = `<p class="text-gray-400 text-sm italic">No orders found for this number.</p>`; return; }
        results.innerHTML = '';
        Object.values(data).reverse().forEach(order => {
            const itemsList = order.items.map(i => `<li class="text-xs text-gray-300">• ${i.name} x ${i.qty}</li>`).join('');
            const div = document.createElement('div');
            div.className = "bg-slate-900 border border-white/10 rounded-xl p-4 mb-3";
            div.innerHTML = `
                <div class="flex justify-between text-xs text-gray-400 mb-1"><span>${order.timestamp}</span><span class="font-bold text-amber-400">${order.status || 'Placed'}</span></div>
                <ul class="mb-2">${itemsList}</ul>
                <div class="text-sm font-bold text-white">Total: ₹${order.total}</div>
                <div class="text-xs text-emerald-400 mt-1">Expected delivery: ${order.deliveryDate || '—'}</div>`;
            results.appendChild(div);
        });
    });
};
