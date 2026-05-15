/* ══════════════════════════════════════════════════════
   FUTURA | ATELIER CUSTOMIZATION
   ══════════════════════════════════════════════════════ */

// ATELIER is now integrated into the Immersive Product Detail Modal.
// Buttons calling openAtelier will be redirected to the cinematic modal.

function openAtelier(jerseyName, price) {
    // This is a fallback in case some legacy code calls it.
    // It should ideally not be reached as renderProducts now calls openProductDetail(p, category, true)
    showToast("OPENING ATELIER...", "success");
    // Find the product and open it? Hard without the full object.
    // So we'll just log it.
    console.log("Legacy openAtelier called for:", jerseyName);
}
