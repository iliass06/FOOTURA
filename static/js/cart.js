/* ══════════════════════════════════════════════════════
   FUTURA | CART SYSTEM
   ══════════════════════════════════════════════════════ */

async function addToCart(product) {
    const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    });
    const data = await res.json();
    if (data.success) {
        updateCartUI();
        showToast('ADDED TO SQUAD!');
    }
}

async function updateCartUI() {
    const res = await fetch('/api/cart');
    const cart = await res.json();
    
    const itemsDiv = document.getElementById('cart-items');
    const totalDiv = document.getElementById('cart-total');
    const toggleBtn = document.querySelector('.cart-toggle');

    if (toggleBtn) toggleBtn.innerText = `CART (${cart.length})`;

    if (itemsDiv) {
        itemsDiv.innerHTML = cart.map((item, index) => `
            <div class="cart-item" style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid rgba(242, 232, 207, 0.05); padding-bottom: 15px;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 1.5rem; margin-right: 15px;">${item.emoji}</span>
                    <div>
                        <div style="font-family: var(--font-accent); letter-spacing: 1px;">${item.name}</div>
                        <div style="color: var(--jungle-bright); font-size: 0.9rem;">${item.price} MAD</div>
                    </div>
                </div>
                <div onclick="removeFromCart(${index})" style="color: rgba(242, 232, 207, 0.3); cursor: pointer; font-size: 0.8rem; letter-spacing: 2px;">REMOVE</div>
            </div>
        `).join('');
    }

    if (totalDiv) {
        const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
        totalDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-family: var(--font-accent); letter-spacing: 2px; opacity: 0.5;">TOTAL</span>
                <span style="font-family: var(--font-accent); font-size: 2rem; color: var(--cream-soda);">${total.toFixed(0)} MAD</span>
            </div>
        `;
    }
}

async function removeFromCart(index) {
    await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
    });
    updateCartUI();
}

async function checkout() {
    const res = await fetch('/api/checkout', { method: 'POST' });
    const data = await res.json();
    showToast(data.message);
    updateCartUI();
    if (document.getElementById('cart-panel').classList.contains('open')) toggleCart();
}

document.addEventListener('DOMContentLoaded', updateCartUI);
