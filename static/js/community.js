/* ══════════════════════════════════════════════════════
   FUTURA | COMMUNITY ENGINE (REVIEWS)
   ══════════════════════════════════════════════════════ */

let currentRating = 0;
let reviewLimit = 4; // Display 4 by default

function setRating(val) {
    currentRating = val;
    const stars = document.querySelectorAll('.star-opt');

    stars.forEach(star => {
        const starVal = parseInt(star.getAttribute('data-value'));
        if (starVal <= val) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });
}

async function handleReviewSubmit() {
    // 1. Check Authentication first
    const authRes = await fetch('/api/auth/status');
    const authData = await authRes.json();
    
    if (!authData.logged_in) {
        showToast("Authentication required. Opening Connect station...", "error");
        setTimeout(() => openAuthModal(), 1000);
        return;
    }

    const comment = document.getElementById('review-comment').value.trim();
    
    if (currentRating === 0) {
        showToast("Please select a star rating for the squad.", "error");
        return;
    }
    if (!comment) {
        showToast("Please provide your tactical feedback.", "error");
        return;
    }

    const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: currentRating, comment: comment })
    });

    const data = await res.json();
    if (data.success) {
        showToast(data.message, "success");
        document.getElementById('review-comment').value = '';
        setRating(0);
        // Reset limit on new submit
        reviewLimit = 4;
        setTimeout(() => loadReviews(), 500);
    } else {
        showToast(data.message, "error");
    }
}

async function loadReviews() {
    try {
        const res = await fetch('/api/reviews');
        const reviews = await res.json();
        
        const listDiv = document.getElementById('reviews-dynamic-list');
        const statsHeader = document.getElementById('review-stats-header');
        
        if (!listDiv) return;

        if (!reviews || reviews.length === 0) {
            listDiv.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.3; font-family:var(--font-accent); letter-spacing:2px;">NO REPORTS DEPLOYED YET</div>`;
            return;
        }

        // 1. Calculate Stats & Distribution
        const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        
        const dist = { 5:0, 4:0, 3:0, 2:0, 1:0 };
        reviews.forEach(r => { if(r.rating) dist[r.rating]++; });

        // 2. Update Stats Header with Distribution
        if (statsHeader) {
            let distHTML = `<div style="margin-top: 20px; display: flex; flex-direction: column; gap: 5px; align-items: flex-end;">`;
            [5, 4, 3, 2, 1].forEach(num => {
                const count = dist[num];
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                distHTML += `
                    <div style="display: flex; align-items: center; gap: 10px; width: 200px; justify-content: flex-end;">
                        <span style="font-size: 0.7rem; opacity: 0.6; letter-spacing: 1px;">${num}★</span>
                        <div class="dist-bar-bg" style="flex-grow: 1; height: 4px; position: relative; max-width: 100px;">
                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${percent}%; background: var(--gold-exact);"></div>
                        </div>
                        <span style="font-size: 0.7rem; opacity: 0.6; width: 25px; text-align: right;">${count}</span>
                    </div>
                `;
            });
            distHTML += `</div>`;

            statsHeader.innerHTML = `
                <div style="font-family: var(--font-accent); font-size: 3rem; color: var(--gold-exact); line-height: 1;">${avgRating}</div>
                <div style="color: var(--gold-exact); margin: 5px 0;">${"★".repeat(Math.round(avgRating))}${"☆".repeat(5 - Math.round(avgRating))}</div>
                <div style="font-size: 0.7rem; opacity: 0.5; letter-spacing: 2px;">${reviews.length} GLOBAL REPORTS</div>
                ${distHTML}
            `;
        }

        // 3. Slice the reviews based on current limit
        const visibleReviews = reviews.slice(0, reviewLimit);

        // Render List
        listDiv.innerHTML = visibleReviews.map(r => {
            const date = new Date(r.created_at);
            const formattedDate = date.toLocaleDateString('en-GB');
            const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            // UI Logic for Identity (Using aliased fields from API)
            let identityHTML = '';
            let initials = '';

            const username = r.u_username;
            const firstName = r.u_first_name;
            const lastName = r.u_last_name;

            if (username) {
                const boldUser = `<b style="color: var(--gold-exact); font-weight: 900;">${username.toUpperCase()}</b>`;
                const smallName = (firstName && lastName) 
                    ? `<span style="font-size: 0.7rem; opacity: 0.4; margin-left: 10px; text-transform: uppercase;">${firstName} ${lastName}</span>`
                    : '';
                identityHTML = `${boldUser} ${smallName}`;
                
                if (firstName && lastName) {
                    initials = (firstName[0] + lastName[0]).toUpperCase();
                } else {
                    initials = username.substring(0, 2).toUpperCase();
                }
            } else {
                identityHTML = `<b style="opacity: 0.5;">ANONYMOUS</b>`;
                initials = '??';
            }

            return `
                <div class="review-card" style="margin-bottom: 30px; padding: 35px; position: relative; transition: all 0.4s;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 50px; height: 50px; background: var(--gold-exact); color: var(--dark); display: flex; justify-content: center; align-items: center; border-radius: 50%; font-family: var(--font-accent); font-weight: bold; font-size: 1.2rem;">
                                ${initials}
                            </div>
                            <div>
                                <div style="font-family: var(--font-accent); font-size: 1.3rem; letter-spacing: 1px; color: var(--cream-soda);">${identityHTML}</div>
                                <div style="font-size: 0.7rem; opacity: 0.4; letter-spacing: 1px;">${formattedDate} @ ${formattedTime}</div>
                            </div>
                        </div>
                        <div style="color: var(--gold-exact); font-size: 1.2rem;">${"★".repeat(r.rating || 0)}${"☆".repeat(5 - (r.rating || 0))}</div>
                    </div>
                    <div style="font-style: italic; line-height: 1.6; opacity: 0.8; font-size: 1.1rem; color: var(--cream-soda); border-left: 2px solid var(--gold-exact); padding-left: 20px;">
                        "${r.comment || ''}"
                    </div>
                </div>
            `;
        }).join('');

        // 4. Handle "See More" button visibility
        const seeMoreBtn = document.getElementById('see-more-reviews');
        if (seeMoreBtn) {
            if (reviews.length > reviewLimit) {
                seeMoreBtn.style.display = 'block';
            } else {
                seeMoreBtn.style.display = 'none';
            }
        }
    } catch (err) {
        console.error("Load reviews error:", err);
    }
}

// Simplified auth check - button always stays but triggers modal if needed
async function checkReviewAuth() {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    const prompt = document.getElementById('review-login-prompt');
    if (prompt) prompt.style.display = data.logged_in ? 'none' : 'block';
}

function showMoreReviews() {
    reviewLimit += 4;
    loadReviews();
}

document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    checkReviewAuth();
});
