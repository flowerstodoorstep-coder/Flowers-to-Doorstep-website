// Live Realtime Firebase Engine Cloud Configuration Linked to Singapore Data Pod
const firebaseConfig = {
  apiKey: "AIzaSyCG9PiY1pdZKm0-Z9raOWQfx8k3YL50n4k",
  authDomain: "flowers-to-doorstep.firebaseapp.com",
  databaseURL: "https://flowers-to-step-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "flowers-to-doorstep",
  storageBucket: "flowers-to-doorstep.firebasestorage.app",
  messagingSenderId: "849984447371",
  appId: "1:849984447371:web:63ea8c98abec5eb218858e",
  measurementId: "G-Y02LJJHGHZ"
};

// Initialize Instance Runtime
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const FALLBACK_SEEDS = [
    { id: "1", name: 'Rose', price: 80, unit: '100 grams loose', category: 'loose flowers', stock: 15, desc: 'Fresh bright red aromatic loose roses for daily pooja arrangements.', img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400' },
    { id: "2", name: 'White Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 5, desc: 'Crisp handpicked traditional white chrysanthemums.', img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=400' },
    { id: "3", name: 'Yellow Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 12, desc: 'Bright yellow auspicious blooms ideal for home decoration festive setups.', img: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=400' },
    { id: "4", name: 'Small Jasmine Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 8, desc: 'Sana Jaji thin-spun tight weave fragrant garland strands.', img: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?q=80&w=400' },
    { id: "5", name: 'Shevanti Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 4, desc: 'Dense thick yellow chrysanthemums woven tightly for deity frames.', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400' }
];

let products = [];
let cart = {};
let selectedCategory = null;
let currentView = 'customer';
let isOwnerAuthenticated = false;

// Auto Setup Database Node if completely missing
db.ref('catalog').once('value', snap => {
    if (!snap.exists()) {
        const seedMap = {};
        FALLBACK_SEEDS.forEach(p => { seedMap[p.id] = p; });
        db.ref('catalog').set(seedMap);
    }
});

// Live Synchronized Inventory Listener (Resolves Array vs Object conversion issue)
db.ref('catalog').on('value', snap => {
    const data = snap.val();
    if (data) {
        // Map elements into a structured local data list array safely
        products = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
    } else {
        products = [];
    }
    renderProducts();
    if (isOwnerAuthenticated && currentView === 'owner') showOwnerDashboard();
});

// Order Log Syncer Engine
db.ref('orders').on('value', snap => {
    if (isOwnerAuthenticated && currentView === 'owner') {
        renderOrderHistory(snap.val());
    }
});

// Load App Wallpaper
document.getElementById('bg-image').style.backgroundImage = "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200')";

function selectCategory(category) {
    if (selectedCategory === category) {
        selectedCategory = null;
        document.getElementById('bg-image').className = "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-100 opacity-100";
    } else {
        selectedCategory = category;
        document.getElementById('bg-image').className = "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-105 opacity-20 blur-md";
    }
    updateNavUI();
    renderProducts();
}

function updateNavUI() {
    ['garlands', 'loose', 'others'].forEach(id => {
        const btn = document.getElementById(`btn-${id}`);
        const catName = id === 'loose' ? 'loose flowers' : id;
        if (selectedCategory === catName) {
            btn.className = "flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 bg-amber-400 text-slate-950 shadow-lg";
        } else {
            btn.className = "flex-1 py-3 text-center rounded-full font-bold text-xs md:text-sm tracking-widest uppercase transition-all duration-300 text-white hover:bg-white/5";
        }
    });
}

function renderProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    if (!selectedCategory) {
        container.className = "block text-center py-16 bg-black/20 backdrop-blur-xs rounded-2xl border border-white/5 p-6 mb-36";
        container.innerHTML = `<p class="text-xl font-medium text-amber-200">Welcome to Our Store</p>
                               <p class="text-gray-400 text-sm mt-2 max-w-md mx-auto">Select a product category tab from the navigation bar above to browse our live inventory.</p>`;
        return;
    }

    container.className = "grid grid-cols-1 sm:grid-cols-2 gap-6 mb-36";
    const filtered = products.filter(p => p && p.category === selectedCategory);
    
    if(filtered.length === 0) {
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
                <img src="${product.img || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400'}" alt="${product.name}" class="w-full h-full object-cover">
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

function addToCart(productId, change) {
    const item = products.find(p => p && p.id === productId);
    const currentQty = cart[productId] || 0;
    const targetQty = currentQty + change;

    if (targetQty > Number(item.stock)) {
        alert(`⚠️ Cannot add more! Only ${item.stock} units remain available in stock for today.`);
        return;
    }

    if (targetQty <= 0) delete cart[productId];
    else cart[productId] = targetQty;

    renderProducts();
    updateCartDrawer();
}

function updateCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const itemsContainer = document.getElementById('cart-items');
    itemsContainer.innerHTML = '';

    let subtotal = 0;
    Object.entries(cart).forEach(([id, qty]) => {
        const prod = products.find(p => p && p.id === id);
        if (prod) {
            subtotal += Number(prod.price) * qty;
            const row = document.createElement('div');
            row.className = "flex justify-between items-center text-sm bg-white/5 p-2.5 rounded-lg border border-white/5";
            row.innerHTML = `<div><span class="font-semibold text-white">${prod.name}</span><span class="text-gray-400 text-xs ml-2">(${qty} x ₹${prod.price})</span></div><span class="font-bold text-amber-400">₹${prod.price * qty}</span>`;
            itemsContainer.appendChild(row);
        }
    });

    if (subtotal === 0) {
        drawer.classList.add('hidden');
        return;
    }
    drawer.classList.remove('hidden');

    const promoBanner = document.getElementById('promo-banner');
    if (subtotal < 200) {
        const remaining = 200 - subtotal;
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-amber-500/10 border border-amber-500/30 text-amber-300";
        promoBanner.innerHTML = `🛒 Your subtotal is ₹${subtotal}. <span class="underline font-bold text-amber-400">Add ₹${remaining} more</span> for FREE delivery!`;
    } else {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        promoBanner.innerHTML = `🎉 Splendid! Your order qualifies for Free Doorstep Delivery.`;
    }

    const fee = (subtotal < 200) ? 20 : 0;
    document.getElementById('pricing-summary').innerText = `Subtotal Items: ₹${subtotal} | Delivery Fee: ${fee > 0 ? `₹${fee}` : 'FREE'}`;
    document.getElementById('cart-total').innerText = `₹${subtotal + fee}`;
    validateAreaSelection();
}

function validateAreaSelection() {
    const area = document.getElementById('delivery-area').value;
    const btn = document.getElementById('checkout-btn');
    const addressInput = document.getElementById('delivery-address');

    if (area === 'outside') {
        btn.innerText = 'UNSERVICEABLE AREA';
        btn.className = "w-full sm:w-auto bg-red-600 text-white px-8 py-4 rounded-xl font-black tracking-widest uppercase text-sm transition cursor-not-allowed";
        addressInput.disabled = true;
    } else {
        btn.innerText = 'PLACE ORDER & SEND WHATSAPP';
        btn.className = "w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 px-8 py-4 rounded-xl font-black tracking-widest uppercase text-sm transition shadow-lg animate-bounce";
        addressInput.disabled = false;
    }
}

function submitOrder() {
    const area = document.getElementById('delivery-area').value;
    const address = document.getElementById('delivery-address').value;
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;

    if (!name.trim()) return alert('⚠️ Please provide your name to route delivery.');
    if (!phone.trim() || phone.length < 10) return alert('⚠️ A valid 10-digit WhatsApp number is needed.');
    if (area === 'outside') return alert('❌ Sorry, delivery is bound to Gowlidoddi layouts only.');
    if (!address.trim()) return alert('⚠️ Complete local housing street address is required.');

    let subtotal = 0;
    let whatsappOrderList = ""; 
    const updates = {};
    const orderItems = [];

    // Loop data checking and setup deductions
    for (const [id, qty] of Object.entries(cart)) {
        const prod = products.find(p => p && p.id === id);
        if (!prod) continue;

        const currentStock = Number(prod.stock);
        if (qty > currentStock) {
            return alert(`🚨 Inventory conflict! "${prod.name}" only has ${currentStock} units left. Please modify your count.`);
        }

        subtotal += Number(prod.price) * qty;
        const netStockLeft = currentStock - qty;
        
        // Build database update path string reference 
        updates[`/catalog/${id}/stock`] = netStockLeft;
        
        whatsappOrderList += `- ${prod.name} (${prod.unit}) x ${qty} = ₹${Number(prod.price) * qty}\n`;
        orderItems.push({ name: prod.name, qty: qty, price: Number(prod.price) });
    }

    const finalFee = subtotal < 200 ? 20 : 0;
    const finalTotal = subtotal + finalFee;

    const logOrderData = {
        name: name,
        phone: phone,
        items: orderItems,
        address: address,
        subtotal: subtotal,
        deliveryFee: finalFee,
        total: finalTotal,
        timestamp: new Date().toLocaleString()
    };

    // 1. Direct Atomic Multi-Node Stock Level Reductions on Firebase Master Account
    db.ref().update(updates).then(() => {
        
        // 2. Archive record entry logs to database history branch
        db.ref('orders').push(logOrderData);

        // 3. Stringify layout schema mapping template for clean payload execution
        const textPayload = 
`New Order - Flowers To Doorstep

🌸 *CUSTOMER DETAILS*
Name: ${name}
Phone: ${phone}
Address: ${address}, Gowlidoddi

📦 *ITEMS ORDERED*
${whatsappOrderList}
💵 *BILLING SUMMARY*
Subtotal: ₹${subtotal}
Delivery: ${finalFee > 0 ? `₹${finalFee}` : 'FREE'}
*Total Amount Payable: ₹${finalTotal}*`;

        // 4. Fire application redirect link mapping engine
        const targetBusinessNumber = "91XXXXXXXXXX"; // Put your actual WhatsApp contact string here
        const targetURL = `https://api.whatsapp.com/send?phone=${targetBusinessNumber}&text=${encodeURIComponent(textPayload)}`;

        alert('🎉 Order logged on dashboard & stock deducted! Opening WhatsApp to forward summary verification...');
        
        // Clear runtime state counters
        cart = {};
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('delivery-address').value = '';
        selectedCategory = null;
        document.getElementById('bg-image').className = "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-100 opacity-100";
        
        updateNavUI();
        updateCartDrawer();

        window.open(targetURL, '_blank');
    }).catch(err => {
        alert("❌ Order Transmission Failed: " + err.message);
    });
}

// OWNER UTILITY MANAGEMENT MECHANICS
function toggleView() {
    const customerView = document.getElementById('customer-view');
    const ownerView = document.getElementById('owner-view');
    const toggleBtn = document.getElementById('view-toggle-btn');

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
}

function verifyOwnerPassword() {
    const inputPass = document.getElementById('owner-password').value;
    if (inputPass === 'admin123') { 
        isOwnerAuthenticated = true;
        document.getElementById('owner-auth').classList.replace('block', 'hidden');
        showOwnerDashboard();
        db.ref('orders').once('value', snap => renderOrderHistory(snap.val()));
    } else {
        alert('❌ Security Credentials Invalid!');
    }
}

function showOwnerDashboard() {
    document.getElementById('owner-dashboard').classList.remove('hidden');
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    products.forEach(p => {
        if (!p) return;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors";
        tr.innerHTML = `
            <td class="p-3">
                <div class="font-bold text-white">${p.name}</div>
                <div class="text-xs text-amber-400 font-semibold mb-1">${p.unit}</div>
                <input type="text" value="${p.desc || ''}" onchange="updateProductField('${p.id}', 'desc', this.value)" placeholder="Add short line description description..." class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3">
                <input type="number" value="${p.price}" onchange="updateProductField('${p.id}', 'price', Number(this.value))" class="w-20 bg-slate-950 border border-white/10 rounded p-1.5 font-bold text-center text-emerald-400 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3">
                <input type="number" value="${p.stock}" onchange="updateProductField('${p.id}', 'stock', Number(this.value))" class="w-20 bg-slate-950 border border-white/10 rounded p-1.5 font-bold text-center text-amber-400 focus:border-amber-400 focus:outline-none">
            </td>
            <td class="p-3 text-center">
                <button onclick="deleteProduct('${p.id}')" class="text-xs font-bold text-red-400 hover:text-red-500 bg-red-500/10 px-2 py-1.5 rounded border border-red-500/20 transition">Remove</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

function addNewProduct() {
    try {
        const name = document.getElementById('new-prod-name').value.trim();
        const category = document.getElementById('new-prod-category').value;
        const price = document.getElementById('new-prod-price').value;
        const unit = document.getElementById('new-prod-unit').value.trim();
        const stock = document.getElementById('new-prod-stock').value;
        const img = document.getElementById('new-prod-img').value.trim();
        const desc = document.getElementById('new-prod-desc') ? document.getElementById('new-prod-desc').value.trim() : '';

        if (!name || !price || !unit || !stock) {
            alert('⚠️ Please fill out all essential fields (Name, Price, Unit, Stock) to save a product.');
            return;
        }

        const uniqueId = Date.now().toString();
        const cleanPayload = {
            id: uniqueId,
            name: name,
            category: category,
            price: Number(price),
            unit: unit,
            stock: Number(stock),
            img: img || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400',
            desc: desc || 'Fresh daily morning arrivals.'
        };

        db.ref(`catalog/${uniqueId}`).set(cleanPayload)
            .then(() => {
                alert('✨ Product successfully registered to cloud database catalog!');
                document.getElementById('new-prod-name').value = '';
                document.getElementById('new-prod-price').value = '';
                document.getElementById('new-prod-unit').value = '';
                document.getElementById('new-prod-stock').value = '';
                if(document.getElementById('new-prod-img')) document.getElementById('new-prod-img').value = '';
                if(document.getElementById('new-prod-desc')) document.getElementById('new-prod-desc').value = '';
            })
            .catch((error) => {
                alert('❌ Firebase Database Error: ' + error.message);
            });
    } catch (err) {
        alert('❌ JavaScript Error: ' + err.message);
    }
}


function updateProductField(productId, field, value) {
    db.ref(`catalog/${productId}/${field}`).set(value);
}

function deleteProduct(productId) {
    if (confirm('🗑️ Are you completely sure you want to remove this item from your store database catalog?')) {
        db.ref(`catalog/${productId}`).remove().then(() => {
            alert('Item removed successfully.');
        });
    }
}

function renderOrderHistory(ordersData) {
    const container = document.getElementById('orders-history-container');
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
                <span class="text-emerald-400 font-bold font-mono">Total Collected: ₹${order.total}</span>
            </div>
            <div class="text-sm font-bold text-white">👤 ${order.name || 'Customer'} (${order.phone || 'N/A'})</div>
            <div class="text-xs text-emerald-400">📍 Delivery to: ${order.address}, Gowlidoddi</div>
            <ul class="space-y-1 bg-white/5 p-2 rounded-lg mt-1">${itemsList}</ul>
        `;
        container.appendChild(div);
    });
}
