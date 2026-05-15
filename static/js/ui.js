/* ══════════════════════════════════════════════════════
   FUTURA | UI & CINEMATICS (OPTIMIZED)
   ══════════════════════════════════════════════════════ */

// Reset scroll and restoration
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Ensure intro flag is cleared on refresh to force animation
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    initCursor();
    initIntro();
    initHeroAnimations();
});

function applySavedTheme() {
    const savedTheme = localStorage.getItem('futura-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

// ── HERO LANDING ANIMATIONS ──
function initHeroAnimations() {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to(".hero-title", { 
        opacity: 1, 
        scale: 1, 
        duration: 2.5
    })
    .to(".hero-slogan", { 
        opacity: 1, 
        duration: 1.5,
        y: -10
    }, "-=1.5");

    // Parallax effect on slogan only (Title is now FIXED as requested)
    document.addEventListener('mousemove', (e) => {
        const xPercent = (e.clientX / window.innerWidth) - 0.5;
        const yPercent = (e.clientY / window.innerHeight) - 0.5;
        
        gsap.to(".hero-slogan", {
            x: xPercent * 20,
            y: yPercent * 20,
            duration: 1.5,
            ease: "power1.out"
        });
    });
}

// ── CUSTOM CURSOR ──
function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
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

// ── INTRO CINEMATIC (TYPEWRITER & IGNITE) ──
function initIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;
    const logo = document.querySelector('.intro-logo');

    // Check if it's a reload or first visit in session
    const navEntry = performance.getEntriesByType("navigation")[0];
    const isReload = navEntry && navEntry.type === "reload";
    const sessionPlayed = sessionStorage.getItem('futura-intro-played');
    const skipIntro = sessionStorage.getItem('futura-skip-intro');

    // If skip flag is set OR already played AND not a reload, skip
    if (skipIntro === 'true' || (sessionPlayed && !isReload)) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        sessionStorage.removeItem('futura-skip-intro'); // Use once
        return;
    }

    // Lock scroll during intro
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    // Set flag for this session
    sessionStorage.setItem('futura-intro-played', 'true');

    // 1. Prepare Typewriter
    const text = logo.innerText;
    logo.innerHTML = text.split('').map(char => `<span class="intro-letter">${char}</span>`).join('');
    const letters = logo.querySelectorAll('.intro-letter');

    // 2. Start Typewriter Sequence
    letters.forEach((span, idx) => {
        setTimeout(() => {
            span.classList.add('letter-appear');
        }, idx * 100); // Slightly faster delay (100ms)
    });

    // 3. Trigger Ignite (after all letters appear)
    const typingDuration = letters.length * 100;
    setTimeout(() => {
        logo.classList.add('logo-ignite');
    }, typingDuration + 150);

    // 4. Remove overlay (after 3 seconds total)
    setTimeout(() => {
        gsap.to(overlay, { 
            opacity: 0,
            duration: 0.8,
            ease: "power3.inOut",
            onComplete: () => {
                overlay.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }, 3000);
}


// ── UI HELPERS ──
function rebootStadium() {
    sessionStorage.removeItem('futura-intro-played');
    // Force scroll to top
    window.scrollTo(0, 0);
    // Redirect to home and force reload
    window.location.href = '/';
}

function toggleCart() {
    const panel = document.getElementById('cart-panel');
    if (panel) panel.classList.toggle('open');
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    // Save preference
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('futura-theme', isLight ? 'light' : 'dark');
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');

    // Define symbols and colors based on type
    const symbol = type === 'success' ? '✓' : '⚠';
    const bgColor = type === 'success' ? '#1b3d2f' : '#3d1b1b'; // Deep green vs Deep red
    const borderColor = type === 'success' ? 'rgba(242, 232, 207, 0.2)' : 'rgba(255, 100, 100, 0.3)';

    t.innerHTML = `<span style="margin-right: 20px; opacity: 0.8;">${symbol}</span>${msg}`;

    t.style.cssText = `
        position: fixed; top: 40px; left: 50%; transform: translateX(-50%);
        background: ${bgColor}; color: #f2e8cf; padding: 25px 60px;
        font-family: var(--font-accent); z-index: 10000; 
        border: 1px solid ${borderColor};
        letter-spacing: 4px; text-transform: uppercase; 
        box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        font-size: 1.8rem;
        pointer-events: none;
        text-align: center;
        min-width: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    document.body.appendChild(t);
    gsap.from(t, { y: -50, opacity: 0, duration: 0.6, ease: "power4.out" });
    setTimeout(() => {
        gsap.to(t, { y: -20, opacity: 0, duration: 0.6, onComplete: () => t.remove() });
    }, 3000);
}
