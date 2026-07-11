// REPLACE your existing showOwnerDashboard() function with this one.
// It adds a visible "Save" button per row (instead of silent auto-save on
// onchange) and shows a clear success/error alert so a failed write can
// never look identical to a successful one.

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

    // One delegated listener handles every row — avoids re-binding issues
    // when the table re-renders on every Firebase update.
    tbody.onclick = function (e) {
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
            const price = Number(row.querySelector('[data-field="price"]').value);
            const stock = Number(row.querySelector('[data-field="stock"]').value);

            if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
                alert('⚠️ Price and stock must be valid numbers.');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Saving…';

            db.ref(`catalog/${id}`).update({ desc, price, stock })
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
