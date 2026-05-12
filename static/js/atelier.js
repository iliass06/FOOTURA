/* ══════════════════════════════════════════════════════
   FUTURA | ATELIER CUSTOMIZATION
   ══════════════════════════════════════════════════════ */

function openAtelier(jerseyName, price) {
    const name = prompt("NAME ON BACK:", "PLAYER");
    const num = prompt("NUMBER:", "10");
    const lang = prompt("TYPOGRAPHY (EN/AR/FR):", "EN");
    
    if(name && num) {
        addToCart({
            id: Date.now(),
            name: `${jerseyName} [Custom: ${name} #${num}]`,
            price: price + 50, // Extra fee for custom
            emoji: '👕'
        });
        showToast('ATELIER: JERSEY PERSONALIZED!');
    }
}
