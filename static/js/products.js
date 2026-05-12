/* ══════════════════════════════════════════════════════
   FUTURA | PRODUCT ENGINE
   ══════════════════════════════════════════════════════ */

async function loadProducts(category, continent = '') {
    let url = `/api/products?category=${category}`;
    if (continent) url += `&continent=${continent}`;

    const res = await fetch(url);
    const products = await res.json();
    renderProducts(category, products);
}

async function loadProductsByLeague(league) {
    if (!league) return loadProducts('jerseys');
    const res = await fetch(`/api/products?category=jerseys&league=${league}`);
    const products = await res.json();
    renderProducts('jerseys', products);
}

function renderProducts(category, products) {
    const gridId = {
        'jerseys': 'jerseys-grid',
        'balls': 'balls-grid',
        'cards': 'cards-grid',
        'accessories': 'accs-grid'
    }[category];

    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = products.map(p => `
        <div class="product-card ${p.is_iconic ? 'iconic' : ''}" data-id="${p.id}" style="${p.is_iconic ? 'border: 1px solid var(--jungle-bright); background: linear-gradient(135deg, var(--gray-dark), #1b3d2f);' : ''}">
            ${p.is_iconic ? '<div style="position:absolute; top:20px; right:20px; color:var(--cream-soda); font-family:var(--font-accent); letter-spacing:2px; font-size:0.8rem; opacity:0.6;">ICONIC</div>' : ''}
            
            <div class="product-image-container">
                ${p.image_url ? 
                    `<img src="${p.image_url}" class="product-image" alt="${p.name}">` : 
                    `<div class="product-emoji">${p.emoji}</div>`
                }
            </div>

            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} MAD</div>
            
            <div style="display: flex; gap: 15px; margin-top: auto; padding-top: 25px;">
                <button class="btn-futura" style="padding: 12px 15px; font-size: 0.8rem; flex: 1; margin-top: 0;" 
                        onclick="addToCart({id: ${p.id}, name: '${p.name}', price: ${p.price}, emoji: '${p.emoji}'})">
                    ACQUIRE
                </button>
                ${category === 'jerseys' ? `
                    <button class="btn-futura" style="padding: 12px 15px; font-size: 0.8rem; flex: 1; margin-top: 0; border-color: var(--jungle-bright); color: var(--cream-soda);" 
                            onclick="openAtelier('${p.name}', ${p.price})">
                        ATELIER
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Animate cards entry
    gsap.from(`#${gridId} .product-card`, {
        y: 40,
        duration: 1.0,
        stagger: 0.1,
        ease: "expo.out",
        scrollTrigger: {
            trigger: `#${gridId}`,
            start: "top 90%"
        }
    });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts('jerseys');
    loadProducts('balls');
    loadProducts('cards');
    loadProducts('accessories');
});
