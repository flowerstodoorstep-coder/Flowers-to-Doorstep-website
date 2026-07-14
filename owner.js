// ── PASTE YOUR CLOUDINARY VALUES HERE ──────────────────────────
const CLOUDINARY_CLOUD_NAME = "a7zxefeq";
const CLOUDINARY_UPLOAD_PRESET = "apvbadec";
// ────────────────────────────────────────────────────────────

let products = [];
let isOwnerAuthenticated = false;

db.ref('catalog').on('value', snap => {
    const data = snap.val();
    products = data ? Object.keys(data).filter(k => data[k]).map(k => ({ id: k, ...data[k] })) : [];
    if (isOwnerAuthenticated) showOwnerDashboard();
});

db.ref('orders').on('value', snap => {
    if (isOwnerAuthenticated) renderOrderHistory(snap.val());
});

window.verifyOwnerPassword = function() {
    const inputPass = document.getElementById('owner-password').value;
    if (inputPass === 'admin123') {
        isOwnerAuthenticated = true;
        document.getElementById('owner-auth').classList.add('hidden');
        document.getElementById('owner-dashboard').classList.remove('hidden');
        showOwnerDashboard();
        db.ref('orders').once('value', snap => renderOrderHistory(snap.val()));
    } else {
        alert('❌ Security Credentials Invalid!');
    }
};

/* ---------------- Image upload to Cloudinary (free, no card needed) ---------------- */
function uploadImageFile(file, onComplete) {
    if (!file) { onComplete(null); return; }

    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
        alert('⚠️ Cloudinary isn\'t set up yet — open owner.js and paste your Cloud name + upload preset at the top.');
        onComplete(null);
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.secure_url) {
                onComplete(data.secure_url);
            } else {
                alert('❌ Image upload failed: ' + (data.error?.message || 'Unknown error'));
                onComplete(null);
            }
        })
        .catch(err => {
            alert('❌ Image upload failed: ' + err.message);
            onComplete(null);
        });
}

/* ---------------- Product table ---------------- */
function showOwnerDashboard() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        if (!p) return;
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors align-top";
        tr.dataset.id = p.id;
        tr.innerHTML = `
            <td class="p-3">
                <img src="${p.img || 'images/placeholder.jpg'}" class="w-14 h-14 object-contain bg-slate-800 rounded-lg mb-2" onerror="this.src='https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400';">
                <input type="text" value="${p.name || ''}" data-field="name" placeholder="Name" class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs font-bold text-white focus:border-amber-400 focus:outline-none mb-1">
                <select data-field="category" class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-amber-400 focus:border-amber-400 focus:outline-none mb-1">
                    <option value="garlands" ${p.category === 'garlands' ? 'selected' : ''}>Garlands</option>
                    <option value="loose flowers" ${p.category === 'loose flowers' ? 'selected' : ''}>Loose Flowers</option>
                    <option value="others" ${p.category === 'others' ? 'selected' : ''}>Others</option>
                </select>
                <input type="text" value="${p.unit || ''}" data-field="unit" placeholder="Unit" class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-400 focus:outline-none mb-1">
                <input type="text" value="${p.desc || ''}" data-field="desc" placeholder="Description..." class="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-gray-300 focus:border-amber-400 focus:outline-none mb-1">
                <input type="file" accept="image/*" data-field="imgfile" class="w-full text-xs text-gray-400">
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
            if (confirm('🗑️ Remove this item from database?')) db.ref(`catalog/${id}`).remove();
            return;
        }

        if (btn.dataset.action === 'save') {
            const name = row.querySelector('[data-field="name"]').value.trim();
            const category = row.querySelector('[data-field="category"]').value;
            const unit = row.querySelector('[data-field="unit"]').value.trim();
            const desc = row.querySelector('[data-field="desc"]').value.trim();
            const price = Number(row.querySelector('[data-field="price"]').value);
            const stock = Number(row.querySelector('[data-field="stock"]').value);
            const fileInput = row.querySelector('[data-field="imgfile"]');
            const file = fileInput.files[0];

            if (!name || !unit) {
                alert('⚠️ Name and unit cannot be empty.');
                return;
            }
            if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
                alert('⚠️ Price and stock must be valid numbers.');
                return;
            }

            btn.disabled = true;
            btn.textContent = file ? 'Uploading…' : 'Saving…';

            uploadImageFile(file, (uploadedUrl) => {
                const updateData = { name, category, unit, desc, price, stock };
                if (uploadedUrl) updateData.img = uploadedUrl;

                db.ref(`catalog/${id}`).update(updateData)
                    .then(() => {
                        btn.textContent = 'Saved ✓';
                        setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 1200);
                    })
                    .catch((err) => {
                        alert('❌ Save failed: ' + err.message);
                        btn.textContent = 'Save';
                        btn.disabled = false;
                    });
            });
        }
    };
}

window.addNewProduct = function() {
    const nameEl = document.getElementById('new-prod-name');
    const catEl = document.getElementById('new-prod-category');
    const priceEl = document.getElementById('new-prod-price');
    const unitEl = document.getElementById('new-prod-unit');
    const stockEl = document.getElementById('new-prod-stock');
    const fileEl = document.getElementById('new-prod-imgfile');
    const descEl = document.getElementById('new-prod-desc');

    const name = nameEl.value.trim();
    const category = catEl.value;
    const price = priceEl.value;
    const unit = unitEl.value.trim();
    const stock = stockEl.value;
    const desc = descEl.value.trim();
    const file = fileEl.files[0];

    if (!name || !price || !unit || !stock) {
        alert('⚠️ Please fill out Name, Price, Unit, and Stock values.');
        return;
    }

    const submitBtn = document.getElementById('add-prod-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = file ? 'Uploading photo…' : 'Saving…';

    uploadImageFile(file, (uploadedUrl) => {
        const uniqueId = "prod_" + Date.now().toString();
        const cleanPayload = {
            id: uniqueId, name, category, price: Number(price), unit, stock: Number(stock),
            img: uploadedUrl || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=400',
            desc: desc || 'Fresh daily morning arrivals.'
        };

        db.ref(`catalog/${uniqueId}`).set(cleanPayload)
            .then(() => {
                alert('✨ Product added to catalogue!');
                [nameEl, priceEl, unitEl, stockEl, descEl].forEach(el => el.value = '');
                fileEl.value = '';
            })
            .catch((error) => alert('❌ Firebase Sync Error: ' + error.message))
            .finally(() => { submitBtn.disabled = false; submitBtn.textContent = 'Save Product to Live Database'; });
    });
};

/* ---------------- Order history ---------------- */
function renderOrderHistory(ordersData) {
    const container = document.getElementById('orders-history-container');
    if (!container) return;
    container.innerHTML = '';
    if (!ordersData) {
        container.innerHTML = `<p class="text-gray-400 text-sm italic">No entries saved yet.</p>`;
        return;
    }
    Object.entries(ordersData).reverse().forEach(([orderId, order]) => {
        const delivered = order.status === 'Delivered';
        const itemsList = order.items.map(i => `<li class="text-xs text-gray-300">• ${i.name} (Qty: ${i.qty}) - ₹${i.price * i.qty}</li>`).join('');
        const div = document.createElement('div');
        div.className = `bg-slate-950 border border-white/10 rounded-xl p-4 space-y-2 border-l-4 shadow-lg ${delivered ? 'border-l-gray-500' : 'border-l-emerald-500'}`;
        div.innerHTML = `
            <div class="flex justify-between items-center text-xs text-gray-400">
                <span>📅 ${order.timestamp}</span>
                <span class="text-emerald-400 font-bold font-mono">Total: ₹${order.total}</span>
            </div>
            <div class="text-sm font-bold text-white">👤 ${order.name || 'Customer'} — <a href="tel:+91${(order.phone || '').replace(/\D/g,'').slice(-10)}" class="text-amber-400 underline">${order.phone || 'N/A'}</a></div>
            <div class="text-xs text-amber-400">${order.paymentMethod || ''} • ${order.status || 'Placed'}</div>
            ${order.notes ? `<div class="text-xs text-gray-400 italic">📝 ${order.notes}</div>` : ''}
            <div class="text-xs text-emerald-400">📍 ${order.address}</div>
            <div class="text-xs text-gray-400">🚚 Expected delivery: ${order.deliveryDate || '—'}</div>
            <ul class="space-y-1 bg-white/5 p-2 rounded-lg mt-1">${itemsList}</ul>
            <div class="flex gap-2 mt-2">
                <button data-order-id="${orderId}" data-action="mark-delivered" class="flex-1 text-xs font-bold py-2 rounded-lg transition ${delivered ? 'bg-white/5 text-gray-500 cursor-default' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}" ${delivered ? 'disabled' : ''}>
                    ${delivered ? '✓ Delivered' : 'Mark as Delivered'}
                </button>
                <button data-order-id="${orderId}" data-action="remove-order" class="text-xs font-bold text-red-400 hover:text-red-500 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 transition">Remove</button>
            </div>`;
        container.appendChild(div);
    });

    container.querySelectorAll('[data-action="remove-order"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('🗑️ Permanently remove this order from history?')) {
                db.ref(`orders/${btn.dataset.orderId}`).remove();
            }
        });
    });

    container.querySelectorAll('[data-action="mark-delivered"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const orderId = btn.dataset.orderId;
            db.ref(`orders/${orderId}`).update({ status: 'Delivered' }).then(() => {
                db.ref(`orders/${orderId}`).once('value', snap => {
                    const order = snap.val();
                    if (!order) return;
                    const customerPhone = (order.phone || '').replace(/\D/g, '').slice(-10);
                    if (customerPhone.length !== 10) {
                        alert('⚠️ Marked as delivered, but the saved phone number looks invalid — couldn\'t open WhatsApp automatically.');
                        return;
                    }
                    const msg = `Hi ${order.name || 'there'}! 🌸 Your order from Flowers to Doorstep has been delivered. Thank you for shopping with us — hope you love your flowers!`;
                    window.open(`https://wa.me/91${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                });
            });
        });
    });
}
