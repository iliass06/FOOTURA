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
    const countSpan = document.getElementById('cart-count-nav');

    if (countSpan) countSpan.innerText = `(${cart.length})`;

    if (itemsDiv) {
        if (cart.length === 0) {
            itemsDiv.innerHTML = `<div style="text-align:center; padding: 40px; opacity: 0.3; font-family:var(--font-accent); letter-spacing:2px;">SQUAD EMPTY</div>`;
        } else {
            itemsDiv.innerHTML = cart.map((item, index) => `
                <div class="cart-item" style="display: flex; gap: 20px; margin-bottom: 30px; border-bottom: 1px solid rgba(201, 150, 63, 0.1); padding-bottom: 20px; position: relative;">
                    <div style="width: 80px; height: 80px; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(242, 232, 207, 0.1);">
                        ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
                    <div style="flex: 1;">
                        <div style="font-family: var(--font-accent); font-size: 1.2rem; letter-spacing: 1px; color: var(--cream-soda);">${item.name}</div>
                        <div style="font-size: 0.65rem; color: var(--gold-exact); letter-spacing: 1px; margin-top: 5px; text-transform: uppercase;">
                            ${item.selectedSize ? `SIZE: ${item.selectedSize}` : ''} 
                            ${item.selectedColor ? ` | ${item.selectedColor}` : ''}
                        </div>
                        ${item.customName ? `
                            <div style="font-size: 0.7rem; background: rgba(201, 150, 63, 0.1); padding: 5px 10px; margin-top: 8px; border-left: 2px solid var(--gold-exact); font-family: var(--font-accent);">
                                PERSONALIZED: ${item.customName.toUpperCase()} #${item.customNumber}
                            </div>
                        ` : ''}
                        <div style="color: var(--cream-soda); font-family: var(--font-accent); font-size: 1.1rem; margin-top: 10px;">${item.price} MAD</div>
                    </div>
                    <div onclick="removeFromCart(${index})" style="position: absolute; top: 0; right: 0; color: #ff4444; cursor: pointer; font-size: 0.7rem; letter-spacing: 1px; opacity: 0.5;">REMOVE</div>
                </div>
            `).join('');
        }
    }

    if (totalDiv) {
        const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
        totalDiv.innerHTML = `
            <div style="border-top: 1px solid var(--gold-exact); padding-top: 25px; margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-family: var(--font-accent); letter-spacing: 3px; opacity: 0.5; font-size: 0.8rem;">SQUAD VALUE</span>
                    <span style="font-family: var(--font-accent); font-size: 2.2rem; color: var(--gold-exact);">${total.toFixed(0)} MAD</span>
                </div>
                <div style="font-size: 0.6rem; letter-spacing: 2px; opacity: 0.4; text-align: right;">TAXES AND DISPATCH CALCULATED AT CHECKOUT</div>
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

async function renderCheckoutPage() {
    const res = await fetch('/api/cart');
    const cart = await res.json();
    
    const listDiv = document.getElementById('checkout-items-list');
    const emptyMsg = document.getElementById('checkout-empty-msg');
    const subtotalEl = document.getElementById('subtotal-amount');
    const totalEl = document.getElementById('total-amount');

    if (!listDiv) return;

    if (cart.length === 0) {
        listDiv.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    listDiv.style.display = 'block';
    if (emptyMsg) emptyMsg.style.display = 'none';

    listDiv.innerHTML = cart.map((item, index) => `
        <div class="checkout-item" style="display: flex; gap: 40px; background: rgba(255,255,255,0.02); padding: 40px; margin-bottom: 30px; border: 1px solid rgba(201, 150, 63, 0.1); transition: all 0.4s ease;">
            <div style="width: 180px; height: 180px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; border: 1px solid rgba(242, 232, 207, 0.05); flex-shrink: 0;">
                ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));">` : ''}
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="font-family: var(--font-accent); font-size: 2.2rem; letter-spacing: 2px; color: var(--cream-soda); margin-bottom: 10px; line-height: 1;">${item.name}</h4>
                        <div style="font-family: var(--font-accent); font-size: 0.9rem; color: var(--gold-exact); letter-spacing: 2px; text-transform: uppercase;">
                            ${item.selectedSize ? `DIMENSION: ${item.selectedSize}` : ''} 
                            ${item.selectedColor ? ` | FINISH: ${item.selectedColor}` : ''}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-family: var(--font-accent); font-size: 2.5rem; color: var(--cream-soda);">${item.price} MAD</div>
                    </div>
                </div>

                ${item.customName ? `
                    <div style="margin-top: 25px; background: linear-gradient(90deg, rgba(201, 150, 63, 0.1), transparent); padding: 20px; border-left: 3px solid var(--gold-exact);">
                        <div style="font-size: 0.6rem; letter-spacing: 3px; opacity: 0.6; margin-bottom: 5px;">STADIUM PERSONALIZATION</div>
                        <div style="font-family: var(--font-accent); font-size: 1.5rem; letter-spacing: 3px; color: var(--cream-soda);">
                            ${item.customName.toUpperCase()} <span style="color: var(--gold-exact); margin-left: 10px;">#${item.customNumber}</span>
                        </div>
                    </div>
                ` : `
                    <p style="margin-top: 25px; opacity: 0.5; font-size: 0.9rem; line-height: 1.6; max-width: 500px;">
                        Authentic equipment curated for elite performance. Hand-inspected and ready for immediate field deployment.
                    </p>
                `}

                <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 30px; opacity: 0.3; font-size: 0.7rem; letter-spacing: 2px;">
                        <span>REF: FT-${item.id || '000'}</span>
                        <span>STATUS: VERIFIED</span>
                    </div>
                    <div onclick="removeAndRefresh(${index})" style="color: #ff4444; cursor: pointer; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px solid transparent; transition: border-color 0.3s;" onmouseover="this.style.borderColor='#ff4444'" onmouseout="this.style.borderColor='transparent'">
                        REMOVE FROM SQUAD
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    window.currentTotal = total; // Store globally for coupon logic
    if (subtotalEl) subtotalEl.innerText = `${total.toFixed(0)} MAD`;
    if (totalEl) totalEl.innerText = `${total.toFixed(0)} MAD`;

    // Animate items entry
    gsap.from(".checkout-item", {
        x: -30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
    });
}

// ── COUPON SYSTEM ──
let appliedDiscount = 0;

async function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const code = input.value.trim().toUpperCase();
    
    if (!code) return;

    const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (data.success) {
        appliedDiscount = data.discount;
        showToast(`TACTIC ACTIVATED: ${appliedDiscount}% OFF`, "success");
        
        // Update UI
        document.getElementById('coupon-applied-msg').style.display = 'block';
        document.getElementById('discount-pct').innerText = appliedDiscount;
        
        // Recalculate Total
        const subtotal = window.currentTotal || 0;
        const reduction = (subtotal * appliedDiscount) / 100;
        const finalTotal = subtotal - reduction;
        
        const totalEl = document.getElementById('total-amount');
        if (totalEl) {
            totalEl.innerText = `${finalTotal.toFixed(0)} MAD`;
            gsap.from(totalEl, { scale: 1.2, color: 'var(--gold-exact)', duration: 0.5 });
        }
        
        input.disabled = true;
    } else {
        showToast(data.message, "error");
        input.value = '';
    }
}


async function removeAndRefresh(index) {
    await removeFromCart(index);
    renderCheckoutPage();
}

document.addEventListener('DOMContentLoaded', updateCartUI);
