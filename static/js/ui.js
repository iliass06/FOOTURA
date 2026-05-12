/* ══════════════════════════════════════════════════════
   FUTURA | UI & CINEMATICS (OPTIMIZED)
   ══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initIntro();
});

// ── CUSTOM CURSOR ──
function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    document.addEventListener('mousemove', (e) => {
        gsap.to(cursor, {
            x: e.clientX - 10,
            y: e.clientY - 10,
            duration: 0.1
        });
    });

    document.querySelectorAll('a, button, select, .product-card').forEach(el => {
        el.addEventListener('mouseenter', () => gsap.to(cursor, { scale: 3, backgroundColor: 'var(--jungle-bright)', opacity: 0.4 }));
        el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, backgroundColor: 'transparent', opacity: 1 }));
    });
}

// ── INTRO CINEMATIC (FASTER & CLEARER) ──
function initIntro() {
    const canvas = document.getElementById('intro-canvas');
    const ctx = canvas.getContext('2d');
    const logo = document.querySelector('.intro-logo');
    const overlay = document.getElementById('intro-overlay');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // High Fidelity Rain Particles
    let particles = [];
    const particleCount = 200; // Increased for clarity
    for(let i=0; i<particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            length: Math.random() * 30 + 10,
            speed: Math.random() * 20 + 15,
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    function drawRain() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Darker background for rain clarity
        ctx.fillStyle = 'rgba(8, 10, 9, 0.2)'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            ctx.strokeStyle = `rgba(242, 232, 207, ${p.opacity})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + p.length);
            ctx.stroke();
            
            p.y += p.speed;
            if(p.y > canvas.height) {
                p.y = -30;
                p.x = Math.random() * canvas.width;
            }
        });
        requestAnimationFrame(drawRain);
    }

    drawRain();

    // Accelerated Timeline
    const tl = gsap.timeline();
    tl.to(logo, { 
        opacity: 1, 
        duration: 0.8, // Faster fade
        ease: "power2.out" 
    })
    .to(logo, { 
        letterSpacing: "80px", // More dramatic expansion
        duration: 1.5, 
        ease: "power1.inOut" 
    }, "-=0.2")
    .to(overlay, { 
        opacity: 0,
        duration: 0.8, // Snappy exit
        ease: "power3.inOut",
        onComplete: () => {
            overlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }, "-=0.5");

    // Intense Lightning
    function triggerLightning() {
        if(Math.random() > 0.92) {
            ctx.fillStyle = 'rgba(242, 232, 207, 0.15)'; // Brighter flash
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            setTimeout(() => {
                ctx.clearRect(0,0, canvas.width, canvas.height);
                // Double strike chance
                if(Math.random() > 0.5) {
                    setTimeout(() => {
                        ctx.fillStyle = 'rgba(242, 232, 207, 0.1)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }, 50);
                }
            }, 40);
        }
    }
    setInterval(triggerLightning, 100);
}

// ── UI HELPERS ──
function toggleCart() {
    document.getElementById('cart-panel').classList.toggle('open');
}

function showToast(msg) {
    const t = document.createElement('div');
    t.innerText = msg;
    t.style.cssText = `
        position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
        background: var(--jungle-green); color: var(--cream-soda); padding: 20px 40px;
        font-family: var(--font-accent); z-index: 5000; border: 1px solid var(--jungle-bright);
        letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(t);
    gsap.from(t, { y: 30, opacity: 0, duration: 0.4, ease: "back.out(1.7)" });
    setTimeout(() => {
        gsap.to(t, { y: -30, opacity: 0, duration: 0.4, onComplete: () => t.remove() });
    }, 2000);
}
