// Live Firebase Configuration Linked to Singapore Database
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

// Initialize Firebase App Instance
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const INITIAL_PRODUCTS = [
    { id: 1, name: 'Rose', price: 80, unit: '100 grams loose', category: 'loose flowers', stock: 10, img: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400' },
    { id: 2, name: 'White Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 5, img: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?q=80&w=400' },
    { id: 3, name: 'Yellow Shevanti', price: 60, unit: '100 grams loose', category: 'loose flowers', stock: 12, img: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=400' },
    { id: 4, name: 'Small Jasmine Garland (Sana Jaji)', price: 60, unit: '1 mura', category: 'garlands', stock: 8, img: 'https://images.unsplash.com/photo-1546842931-886c185b4c8c?q=80&w=400' },
    { id: 5, name: 'Shevanti Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 4, img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400' },
    { id: 6, name: 'Jasmine Garland', price: 60, unit: '1 mura', category: 'garlands', stock: 7, img: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400' },
    { id: 7, name: 'Tulasi Garland', price: 50, unit: '1 mura', category: 'garlands', stock: 3, img: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=80&w=400' },
    { id: 8, name: 'Betel Leaf Garland', price: 50, unit: '21 leaves', category: 'garlands', stock: 6, img: 'https://images.unsplash.com/photo-1599307767316-776533bb941c?q=80&w=400' },
    { id: 9, name: 'Coconut', price: 50, unit: '1 piece', category: 'others', stock: 15, img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=400' },
    { id: 10, name: 'Betel Leaves', price: 15, unit: 'pack of 5', category: 'others', stock: 20, img: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=400' }
];

let products = [];
let cart = {};
let selectedCategory = null;
let currentView = 'customer';
let isOwnerAuthenticated = false;

// Seed Database Collections if Fresh Instance
db.ref('products').once('value', snapshot => {
    if (!snapshot.exists()) {
        db.ref('products').set(INITIAL_PRODUCTS);
    }
});

// Live Inventory Sync (Bulletproof Array Conversion)
db.ref('products').on('value', snapshot => {
    if (snapshot.exists()) {
        const rawData = snapshot.val();
        // Safely convert to a clean array even if Firebase turns it into an object
        products = Array.isArray(rawData) ? rawData : Object.values(rawData);
        
        renderProducts();
        if (isOwnerAuthenticated && currentView === 'owner') showOwnerDashboard();
    }
});


// Live Orders Sync Engine
db.ref('orders').on('value', snapshot => {
    if (isOwnerAuthenticated && currentView === 'owner') {
        renderOrderHistory(snapshot.val());
    }
});

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
        const btn = document.getElementById(`btn-${id === 'loose' ? 'loose' : id}`);
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
                               <p class="text-gray-400 text-sm mt-2 max-w-md mx-auto">Select a product category tab from the taskbar above to expand and view our live daily stock.</p>`;
        return;
    }

    container.className = "grid grid-cols-1 sm:grid-cols-2 gap-6 mb-36";
    const filtered = products.filter(p => p && p.category === selectedCategory);
    
    filtered.forEach(product => {
        const cartQty = cart[product.id] || 0;
        const card = document.createElement('div');
        card.className = "bg-slate-900/80 border border-white/5 rounded-xl overflow-hidden flex flex-col justify-between shadow-xl relative";
        
        let actionButtons = product.stock <= 0 
            ? `<span class="text-gray-500 font-medium text-xs">Unavailable</span>`
            : `<div class="flex items-center gap-2">
                    ${cartQty > 0 ? `<button onclick="addToCart(${product.id}, -1)" class="bg-white/10 hover:bg-white/20 w-8 h-8 rounded-lg font-bold flex items-center justify-center border border-white/20">-</button>` : ''}
                    ${cartQty > 0 ? `<span class="font-bold text-sm px-1">${cartQty}</span>` : ''}
                    <button onclick="addToCart(${product.id}, 1)" class="bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition">
                        ${cartQty > 0 ? 'Add More' : 'Add to Cart'}
                    </button>
               </div>`;

        card.innerHTML = `
            <div class="relative h-48 bg-slate-800">
                <img src="${product.img}" alt="${product.name}" class="w-full h-full object-cover">
                ${product.stock <= 0 ? `<div class="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-xs"><span class="bg-red-600 text-white font-black px-4 py-2 rounded text-xs tracking-widest uppercase border border-red-400">OUT OF STOCK</span></div>` : ''}
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-lg text-white">${product.name}</h3>
                    <p class="text-gray-400 text-xs mt-0.5">${product.unit}</p>
                </div>
                <div class="flex items-center justify-between mt-4">
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

    if (targetQty > item.stock) {
        alert(`⚠️ Cannot add more. Only ${item.stock} items left in stock for today!`);
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
        const prod = products.find(p => p && p.id === parseInt(id));
        if (prod) {
            subtotal += prod.price * qty;
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
        promoBanner.innerHTML = `🛒 Your cart total is ₹${subtotal}. <span class="underline font-bold text-amber-400">Add ₹${remaining} more</span> to get FREE delivery!`;
    } else {
        promoBanner.className = "mb-4 text-center text-xs font-semibold p-3 rounded-xl tracking-wide bg-emerald-500/10 border border-emerald-500/30 text-emerald-400";
        promoBanner.innerHTML = `🎉 Congratulations! Your order qualifies for Free Delivery.`;
    }

    const fee = (subtotal < 200) ? 20 : 0;
    document.getElementById('pricing-summary').innerText = `Subtotal: ₹${subtotal} | Delivery: ${fee > 0 ? `₹${fee}` : 'FREE'}`;
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
        btn.innerText = 'PLACE ORDER VIA WEBSITE';
        btn.className = "w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 px-8 py-4 rounded-xl font-black tracking-widest uppercase text-sm transition shadow-lg";
        addressInput.disabled = false;
    }
}

function submitOrder() {
    const area = document.getElementById('delivery-area').value;
    const address = document.getElementById('delivery-address').value;
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;

    // Form Field Validations
    if (!name.trim()) {
        alert('⚠️ Please enter your name.');
        return;
    }
    if (!phone.trim() || phone.length < 10) {
        alert('⚠️ Please enter a valid 10-digit WhatsApp number.');
        return;
    }
    if (area === 'outside') {
        alert('❌ Error: Delivery is restricted to Gowlidoddi.');
        return;
    }
    if (!address.trim()) {
        alert('⚠️ Please specify your precise address in Gowlidoddi.');
        return;
    }

    let subtotal = 0;
    let whatsappOrderList = ""; 

    const orderItems = Object.entries(cart).map(([id, qty]) => {
        const prod = products.find(p => p && p.id === parseInt(id));
        subtotal += prod.price * qty;
        prod.stock = Math.max(0, prod.stock - qty);
        
        // Formats WhatsApp Line items clearly
        whatsappOrderList += `- ${prod.name} ${prod.unit.split(' ')[0]} x ${qty} = ₹${prod.price * qty}\n`;
        
        return { name: prod.name, qty: qty, price: prod.price };
    });

    const finalFee = subtotal < 200 ? 20 : 0;
    const finalTotal = subtotal + finalFee;

    const orderData = {
        name: name,
        phone: phone,
        items: orderItems,
        address: address,
        subtotal: subtotal,
        deliveryFee: finalFee,
        total: finalTotal,
        timestamp: new Date().toLocaleString()
    };

    // 1. Push order data directly into Firebase real-time database
    db.ref('orders').push(orderData).then(() => {
        db.ref('products').set(products);
        
        // 2. Generate text layout parameters for WhatsApp structure
        const whatsappMessage = 
`New Order - Flowers To Doorstep

Name: ${name}
Phone: ${phone}
Address: ${address}

Order:
${whatsappOrderList}
Total: ₹${finalTotal}`;

        // 3. Launch WhatsApp link engine (Replace with your actual business phone number)
        const ownerWhatsAppNumber = "91XXXXXXXXXX"; 
        const encodedText = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://api.whatsapp.com/send?phone=${ownerWhatsAppNumber}&text=${encodedText}`;

        alert('🎉 Order processed successfully! Redirecting to WhatsApp to send your summary message...');
        
        // Reset local cart and forms
        cart = {};
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('delivery-address').value = '';
        selectedCategory = null;
        document.getElementById('bg-image').className = "fixed inset-0 bg-cover bg-center transition-all duration-700 ease-in-out z-0 scale-100 opacity-100";
        
        updateNavUI();
        updateCartDrawer();

        // Direct user tab to WhatsApp messaging application
        window.open(whatsappURL, '_blank');
    });
}

// Owner Dashboard Core Mechanics
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
        db.ref('orders').once('value', snapshot => renderOrderHistory(snapshot.val()));
    } else {
        alert('❌ Invalid Secret Passkey!');
    }
}

function showOwnerDashboard() {
    document.getElementById('owner-dashboard').classList.remove('hidden');
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';

    products.forEach((p, index) => {
        if (!p) return;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/2";
        tr.innerHTML = `
            <td class="p-3 font-semibold"><div>${p.name}</div><div class="text-xs text-gray-400 font-normal">${p.unit}</div></td>
            <td class="p-3">
                <input type="number" min="0" value="${p.stock}" onchange="updateStock(${index}, this.value)" class="w-20 bg-slate-950 border border-white/20 rounded-lg p-2 text-center text-amber-400 font-bold focus:outline-none focus:border-amber-400">
            </td>`;
        tbody.appendChild(tr);
    });
}

function updateStock(index, val) {
    products[index].stock = Math.max(0, parseInt(val) || 0);
    db.ref('products').set(products);
}

function renderOrderHistory(ordersData) {
    const container = document.getElementById('orders-history-container');
    container.innerHTML = '';

    if (!ordersData) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No orders received yet.</p>`;
        return;
    }

    Object.values(ordersData).reverse().forEach(order => {
        const div = document.createElement('div');
        div.className = "bg-slate-950 border border-white/10 rounded-xl p-4 space-y-2 shadow-inner border-l-4 border-l-emerald-500 animate-fadeIn";
        
        let itemsList = order.items.map(i => `<li class="text-xs text-gray-300">• ${i.name} (Qty: ${i.qty}) - ₹${i.price * i.qty}</li>`).join('');
        
        div.innerHTML = `
            <div class="flex justify-between items-center text-xs text-gray-400">
                <span>📅 ${order.timestamp}</span>
                <span class="text-emerald-400 font-bold font-mono">Total: ₹${order.total}</span>
            </div>
            <div class="text-sm font-bold text-white">👤 ${order.name || 'Customer'} (${order.phone || 'N/A'})</div>
            <div class="text-xs text-gray-300">📍 Address: ${order.address}, Gowlidoddi</div>
            <ul class="space-y-1 bg-white/5 p-2 rounded-lg mt-1">${itemsList}</ul>
        `;
        container.appendChild(div);
    });
}
