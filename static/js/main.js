/* ══════════════════════════════════════════════════════
   FUTURA | MAIN ORCHESTRATOR
   Lenis Smooth Scroll + GSAP + Three.js Nav
   ══════════════════════════════════════════════════════ */

// Register plugins immediately
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Hide Cart for Admins (Use the server-injected role)
    if (window.currentUserRole === 'admin') {
        const cartToggle = document.querySelector('.cart-toggle');
        if (cartToggle) cartToggle.style.display = 'none';
    }

    initLenis();
    initThreeNav();
    initGSAPAnimations();
});

// ══════════════════════════════
//  ADMIN FIELD TOOLS
// ══════════════════════════════

function openEditModal(p) {
    const modal = document.getElementById('admin-edit-modal');
    if (!modal) return;

    // UI state
    document.getElementById('modal-title').innerText = "MODIFY EQUIPMENT INTEL";
    document.getElementById('btn-save-product').onclick = saveProductEdit;

    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('edit-name').value = p.name;
    document.getElementById('edit-price').value = p.price;
    document.getElementById('edit-image').value = p.image_url || '';
    
    // Category select (hidden for edit usually, but let's keep it consistent)
    const catSelect = document.getElementById('edit-category');
    if (catSelect) catSelect.parentElement.style.display = 'none';

    // Set filter values if they exist
    if (document.getElementById('edit-league')) document.getElementById('edit-league').value = p.league || 'laliga';
    if (document.getElementById('edit-continent')) document.getElementById('edit-continent').value = p.continent || 'europe';
    if (document.getElementById('edit-brand')) document.getElementById('edit-brand').value = p.brand || 'nike';
    if (document.getElementById('edit-card-type')) document.getElementById('edit-card-type').value = p.card_type || 'standard';

    // Handle filter visibility for edit
    updateAdminFilterVisibility(p.category_slug || 'jerseys');

    document.getElementById('edit-file').value = '';
    modal.style.display = 'flex';
}

function openAddModal(defaultCategory = 'jerseys') {
    const modal = document.getElementById('admin-edit-modal');
    if (!modal) return;

    // UI state
    document.getElementById('modal-title').innerText = "DEPLOY NEW EQUIPMENT";
    document.getElementById('btn-save-product').onclick = saveNewProduct;

    // Reset fields
    document.getElementById('edit-product-id').value = '';
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-price').value = '';
    document.getElementById('edit-image').value = '';
        document.getElementById('edit-file').value = '';

    const catSelect = document.getElementById('edit-category');
    if (catSelect) {
        catSelect.parentElement.style.display = 'block';
        catSelect.value = defaultCategory;
        updateAdminFilterVisibility(defaultCategory);
    }

    modal.style.display = 'flex';
}

function updateAdminFilterVisibility(category) {
    const lg = document.getElementById('edit-league-group');
    const cg = document.getElementById('edit-continent-group');
    const bg = document.getElementById('edit-brand-group');
    const tg = document.getElementById('edit-card-type-group');

    if (lg) lg.style.display = (category === 'jerseys') ? 'block' : 'none';
    if (cg) cg.style.display = (category === 'jerseys' || category === 'lifestyle' || category === 'cards') ? 'block' : 'none';
    if (bg) bg.style.display = (category === 'boots' || category === 'balls') ? 'block' : 'none';
    if (tg) tg.style.display = (category === 'cards') ? 'block' : 'none';
}

// Add event listener for category change if select exists
document.addEventListener('change', (e) => {
    if (e.target.id === 'edit-category') {
        updateAdminFilterVisibility(e.target.value);
    }
});

function closeEditModal() {
    document.getElementById('admin-edit-modal').style.display = 'none';
}

async function handleFileUpload() {
    const fileInput = document.getElementById('edit-file');
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        
        const uploadRes = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
            return uploadData.url;
        } else {
            showToast("Upload failed: " + uploadData.message, "error");
            return null;
        }
    }
    return document.getElementById('edit-image').value;
}

async function saveNewProduct() {
    const imageUrl = await handleFileUpload();
    if (imageUrl === null && document.getElementById('edit-file').files.length > 0) return;

    const data = {
        category_slug: document.getElementById('edit-category').value,
        name: document.getElementById('edit-name').value,
        price: document.getElementById('edit-price').value,
                image_url: imageUrl,
        league: document.getElementById('edit-league') ? document.getElementById('edit-league').value : null,
        continent: document.getElementById('edit-continent') ? document.getElementById('edit-continent').value : null,
        brand: document.getElementById('edit-brand') ? document.getElementById('edit-brand').value : null,
        card_type: document.getElementById('edit-card-type') ? document.getElementById('edit-card-type').value : null
    };

    if (!data.name || !data.price) {
        showToast("NAME AND PRICE REQUIRED", "error");
        return;
    }

    const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        showToast("NEW EQUIPMENT DEPLOYED", "success");
        closeEditModal();
        sessionStorage.setItem('futura-skip-intro', 'true');
        location.reload();
    }
}

async function saveProductEdit() {
    const id = document.getElementById('edit-product-id').value;
    const imageUrl = await handleFileUpload();
    if (imageUrl === null && document.getElementById('edit-file').files.length > 0) return;

    const data = {
        name: document.getElementById('edit-name').value,
        price: document.getElementById('edit-price').value,
        image_url: imageUrl,
                league: document.getElementById('edit-league') ? document.getElementById('edit-league').value : null,
        continent: document.getElementById('edit-continent') ? document.getElementById('edit-continent').value : null,
        brand: document.getElementById('edit-brand') ? document.getElementById('edit-brand').value : null,
        card_type: document.getElementById('edit-card-type') ? document.getElementById('edit-card-type').value : null
    };

    const res = await fetch(`/api/admin/product/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (res.ok) {
        showToast("INTEL UPDATED ON FIELD", "success");
        closeEditModal();
        sessionStorage.setItem('futura-skip-intro', 'true');
        location.reload(); 
    }
}

async function deleteProduct(id) {
    showConfirmModal("STADIUM REMOVAL", "CONFIRM PERMANENT REMOVAL FROM STADIUM?", async () => {
        const res = await fetch(`/api/admin/product/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showToast("EQUIPMENT REMOVED FROM FIELD", "success");
            sessionStorage.setItem('futura-skip-intro', 'true');
            location.reload();
        } else {
            const err = await res.json();
            showToast("ERROR: " + err.message, "error");
        }
    });
}

// ── CONFIRMATION MODAL SYSTEM ──
function showConfirmModal(title, msg, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-msg').innerText = msg;
    
    const confirmBtn = document.getElementById('confirm-action-btn');
    confirmBtn.onclick = async () => {
        await onConfirm();
        closeConfirmModal();
    };

    modal.style.display = 'flex';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'none';
}

// Make functions global for inline onclick handlers
window.showConfirmModal = showConfirmModal;
window.closeConfirmModal = closeConfirmModal;
window.openEditModal = openEditModal;
window.openAddModal = openAddModal;
window.deleteProduct = deleteProduct;
window.saveProductEdit = saveProductEdit;
window.saveNewProduct = saveNewProduct;
window.closeEditModal = closeEditModal;

// Enter Key Support in Modal
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('admin-edit-modal');
    if (modal && modal.style.display === 'flex' && e.key === 'Enter') {
        const btn = document.getElementById('btn-save-product');
        if (btn) btn.click();
    }
});


// ── LENIS SMOOTH SCROLL ──
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenisInstance = new Lenis();

    // Sync ScrollTrigger with Lenis
    lenisInstance.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// ── THREE.JS NAV BALL ──
function initThreeNav() {
    const container = document.getElementById('nav-3d-ball');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(120, 120);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.5, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0xc9963f,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const ball = new THREE.Mesh(geometry, material);
    scene.add(ball);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 4;

    function animate() {
        requestAnimationFrame(animate);
        ball.rotation.y += 0.005;
        ball.rotation.x += 0.002;
        renderer.render(scene, camera);
    }
    animate();
}

// ── GSAP ANIMATIONS ──
function initGSAPAnimations() {
    // Fade in intro
    if (!sessionStorage.getItem('futura-skip-intro')) {
        gsap.to("#intro-overlay", {
            opacity: 0,
            duration: 1.5,
            delay: 1.5,
            onComplete: () => {
                document.getElementById('intro-overlay').style.display = 'none';
            }
        });
    } else {
        document.getElementById('intro-overlay').style.display = 'none';
        sessionStorage.removeItem('futura-skip-intro');
    }

    // Hero content parallax
    gsap.to(".hero-content-wrapper", {
        scrollTrigger: {
            trigger: "#hero-landing",
            start: "top top",
            end: "bottom top",
            scrub: true
        },
        y: 200,
        opacity: 0
    });
}

// Global functions for templates
window.submitCustomRequest = async function() {
    const name = document.getElementById('cr-name').value;
    const contact = document.getElementById('cr-contact').value;
    const msg = document.getElementById('cr-msg').value;

    if(!name || !contact || !msg) {
        showToast("COMPLETE ALL FIELDS FOR SCOUTING", "error");
        return;
    }

    const res = await fetch('/api/custom-request', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, contact, message: msg })
    });

    if(res.ok) {
        showToast("SEARCH INITIATED. STAND BY.");
        document.getElementById('cr-name').value = '';
        document.getElementById('cr-contact').value = '';
        document.getElementById('cr-msg').value = '';
    }
}
