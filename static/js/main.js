/* ══════════════════════════════════════════════════════
   FUTURA | MAIN ORCHESTRATOR
   Lenis Smooth Scroll + GSAP + Three.js Nav
   ══════════════════════════════════════════════════════ */

// Register plugins immediately
if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener('DOMContentLoaded', () => {
    initLenis();
    initThreeNav();
    initGSAPAnimations();
});

let lenisInstance;

// ── LENIS SMOOTH SCROLL ──
function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenisInstance = new Lenis();
    function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
}

// ── THREE.JS 3D NAV BALL ──
function initThreeNav() {
    const container = document.getElementById('nav-3d-ball');
    if (!container || typeof THREE === 'undefined') return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(140, 140);
    container.appendChild(renderer.domElement);

    // Ball Geometry
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0xc9963f, 
        wireframe: true,
        emissive: 0xc9963f,
        emissiveIntensity: 0.2
    });
    const ball = new THREE.Mesh(geometry, material);
    scene.add(ball);

    const light = new THREE.PointLight(0xf2e8cf, 1, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x0c0f0e));

    camera.position.z = 2;

    function animate() {
        requestAnimationFrame(animate);
        ball.rotation.x += 0.005;
        ball.rotation.y += 0.008;
        renderer.render(scene, camera);
    }
    animate();

    // Hover effect
    container.addEventListener('mouseenter', () => {
        gsap.to(ball.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.8, ease: "expo.out" });
        gsap.to(material, { emissiveIntensity: 0.8, duration: 0.5 });
    });
    container.addEventListener('mouseleave', () => {
        gsap.to(ball.scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: "expo.out" });
        gsap.to(material, { emissiveIntensity: 0.1, duration: 0.5 });
    });

    // Click to scroll to top
    container.addEventListener('click', () => {
        if (lenisInstance) {
            lenisInstance.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    const miniLogo = document.getElementById('nav-logo-mini');
    if (miniLogo) {
        miniLogo.addEventListener('click', () => {
            if (lenisInstance) {
                lenisInstance.scrollTo(0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

// ── GSAP SCROLL TRIGGERS ──
function initGSAPAnimations() {
    // Section Title Parallax
    document.querySelectorAll('.section-title').forEach(title => {
        gsap.to(title, {
            scrollTrigger: {
                trigger: title,
                start: "top bottom",
                end: "bottom top",
                scrub: 2
            },
            x: 50,
            opacity: 1
        });
    });

    // Stadium Light Flickers
    setInterval(() => {
        const bg = document.querySelector('.stadium-bg');
        if(bg && Math.random() > 0.92) {
            gsap.to(bg, { opacity: 0.6, duration: 0.05, yoyo: true, repeat: 1 });
        }
    }, 1500);
}

// ── CUSTOM REQUESTS ──
async function submitCustomRequest() {
    const data = {
        name: document.getElementById('cr-name').value,
        contact: document.getElementById('cr-contact').value,
        message: document.getElementById('cr-msg').value
    };
    
    if(!data.name || !data.contact || !data.message) {
        showToast('Identification required.');
        return;
    }

    const res = await fetch('/api/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if(res.ok) {
        showToast('SEARCH INITIATED. STAND BY.');
        document.getElementById('cr-name').value = '';
        document.getElementById('cr-contact').value = '';
        document.getElementById('cr-msg').value = '';
    }
}
