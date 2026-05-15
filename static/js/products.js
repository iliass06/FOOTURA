/* ══════════════════════════════════════════════════════
   FUTURA | PRODUCT ENGINE
   ══════════════════════════════════════════════════════ */

async function loadProducts(category, filterType = null, filterValue = null, btn = null) {
    let url = `/api/products?category=${category}`;
    
    // If filterType is 'limit' (for initial load), use it correctly
    if (filterType === 'limit') {
        url += `&limit=${filterValue}`;
    } else if (filterType && filterValue) {
        url += `&${filterType}=${filterValue}`;
    }
    
    // UI Feedback for Filters
    if (btn) {
        const parent = btn.parentElement;
        parent.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('active');
            b.style.borderColor = 'rgba(201,150,63,0.1)';
            b.style.color = 'var(--cream-soda)';
        });
        btn.classList.add('active');
        btn.style.borderColor = 'var(--gold-exact)';
        btn.style.color = 'var(--gold-exact)';
    }

    try {
        const res = await fetch(url);
        const products = await res.json();
        renderProducts(category, products, filterType === 'limit');
    } catch (err) {
        console.error("Failed to load products:", err);
    }
}

async function loadProductsByLeague(league) {
    return loadProducts('jerseys', 'league', league);
}

function renderProducts(category, products, isLimited = false) {
    const isAdmin = window.currentUserRole === 'admin';

    const gridId = {
        'jerseys': 'jerseys-grid',
        'balls': 'balls-grid',
        'cards': 'cards-grid',
        'boots': 'boots-grid',
        'lifestyle': 'lifestyle-grid'
    }[category];

    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 100px; opacity: 0.5; font-family: var(--font-accent); letter-spacing: 2px;">NO EQUIPMENT FOUND IN THIS SECTOR</div>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div class="product-card ${p.is_iconic ? 'iconic' : ''}" data-id="${p.id}" style="${p.is_iconic ? 'border: 1px solid var(--gold-exact); background: linear-gradient(135deg, var(--gray-dark), #1b3d2f);' : ''}; opacity: 0;">
            ${p.is_iconic ? '<div style="position:absolute; top:20px; right:20px; color:var(--gold-exact); font-family:var(--font-accent); letter-spacing:2px; font-size:0.8rem; opacity:0.8;">ICONIC</div>' : ''}
            
            <div class="product-image-container">
                ${p.image_url ? 
                    `<img src="${p.image_url}" class="product-image" alt="${p.name}">` : ''
                }
            </div>

            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} MAD</div>
            
            <div style="display: flex; gap: 10px; margin-top: auto; padding-top: 25px;">
                ${isAdmin ? `
                    <button class="btn-futura" style="padding: 12px; font-size: 0.7rem; flex: 1; margin-top: 0; background: var(--gold-exact); color: var(--dark); border-color: var(--gold-exact);" 
                            onclick="openEditModal(${JSON.stringify(p).replace(/"/g, '&quot;')})">
                        EDIT INTEL
                    </button>
                    <button class="btn-futura" style="padding: 12px; font-size: 0.7rem; flex: 1; margin-top: 0; border-color: #ff4444; color: #ff4444;" 
                            onclick="deleteProduct(${p.id})">
                        REMOVE
                    </button>
                ` : `
                    <button class="btn-futura" style="padding: 12px 15px; font-size: 0.8rem; flex: 1; margin-top: 0;" 
                            onclick="openProductDetail(${JSON.stringify(p).replace(/"/g, '&quot;')}, '${category}')">
                        ACQUIRE
                    </button>
                `}
            </div>
        </div>
    `).join('');

    // --- GUARANTEED VISIBILITY ENGINE ---
    setTimeout(() => {
        gsap.to(`#${gridId} .product-card`, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, overwrite: 'auto' });
    }, 1000);

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
        gsap.fromTo(`#${gridId} .product-card`, 
            { y: 60, opacity: 0 },
            {
                y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out",
                scrollTrigger: { trigger: `#${gridId}`, start: "top 92%", toggleActions: "play none none none" }
            }
        );
    } else {
        document.querySelectorAll(`#${gridId} .product-card`).forEach(el => el.style.opacity = '1');
    }
}

// ── PRODUCT DETAIL MODAL LOGIC ──

let currentDetailProduct = null;
let currentSelectedSize = null;

function openProductDetail(p, category, focusCustomization = false) {
    currentDetailProduct = p;
    currentSelectedSize = null;
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;
    
    document.getElementById('pd-name').innerText = p.name;
    document.getElementById('pd-price').innerText = `${p.price} MAD`;
    document.getElementById('pd-badge').innerText = p.badge ? p.badge.toUpperCase() : "EQUIPMENT";

    const imgEl = document.getElementById('pd-image');
    if (p.image_url) {
        imgEl.src = p.image_url;
        imgEl.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
    }

    const sizeContainer = document.getElementById('size-options');
    let sizes = ['S', 'M', 'L', 'XL', 'XXL']; 
    if (category === 'boots') sizes = ['38', '39', '40', '41', '42', '43', '44', '45'];
    if (category === 'balls') sizes = ['SIZE 3', 'SIZE 4', 'SIZE 5'];
    if (category === 'cards') sizes = ['STANDARD', 'GOLD LEAF', 'LIMITED'];

    sizeContainer.innerHTML = sizes.map(s => `
        <button class="size-btn" onclick="selectSize(this, '${s}')">${s}</button>
    `).join('');

    const jerseyFields = document.getElementById('jersey-custom-fields');
    if (jerseyFields) {
        jerseyFields.style.display = (category === 'jerseys') ? 'block' : 'none';
        document.getElementById('pd-back-name').value = '';
        document.getElementById('pd-back-number').value = '';
    }

    modal.style.display = 'flex';
    gsap.fromTo("#product-detail-modal .modal-content", 
        { y: 150, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" }
    );
}

function selectSize(btn, size) {
    document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentSelectedSize = size;
}

function closeProductDetail() {
    const modal = document.getElementById('product-detail-modal');
    if (!modal) return;
    gsap.to("#product-detail-modal .modal-content", { 
        y: 80, opacity: 0, scale: 0.95, duration: 0.6, ease: "power3.in",
        onComplete: () => { modal.style.display = 'none'; }
    });
}

document.addEventListener('mousedown', (e) => {
    const modal = document.getElementById('product-detail-modal');
    if (modal && e.target === modal) { closeProductDetail(); }
});

function handleAcquisition() {
    if (!currentSelectedSize) {
        showToast("SELECT YOUR SIZE BEFORE ACQUISITION", "error");
        gsap.to('#size-options', { x: 10, duration: 0.1, repeat: 5, yoyo: true });
        return;
    }
    const backName = document.getElementById('pd-back-name') ? document.getElementById('pd-back-name').value : '';
    const backNumber = document.getElementById('pd-back-number') ? document.getElementById('pd-back-number').value : '';
    const productData = { ...currentDetailProduct, selectedSize: currentSelectedSize, customName: backName, customNumber: backNumber };
    if (typeof addToCart === 'function') { addToCart(productData); closeProductDetail(); }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/') {
        loadProducts('jerseys', 'limit', 6);
        loadProducts('balls', 'limit', 6);
        loadProducts('boots', 'limit', 6);
        loadProducts('cards', 'limit', 6);
        loadProducts('lifestyle', 'limit', 6);
    }
    const pdAddBtn = document.getElementById('pd-add-btn');
    if (pdAddBtn) { pdAddBtn.onclick = handleAcquisition; }
});
