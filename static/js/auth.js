/* ══════════════════════════════════════════════════════
   FUTURA | AUTH ENGINE
   ══════════════════════════════════════════════════════ */

// function openAuthModal() {
//     const modal = document.getElementById('auth-modal');
//     if (modal) {
//         modal.style.display = 'flex';
//         gsap.from(".modal-content", { y: -50, opacity: 0, duration: 0.6, ease: "power4.out" });
//     }
// }

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        clearAuthInputs(); // Ensure clean slate
        modal.style.display = 'flex';
        // FORCE the default view to Login every time you click Connect
        document.getElementById('login-view').style.display = 'block';
        document.getElementById('register-view').style.display = 'none';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
        clearAuthInputs();
    }
}

function clearAuthInputs() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            input.value = '';
            // Reset border color to default gold
            input.style.borderColor = 'var(--gold-exact)';
        });
    }
}

function switchToRegister() {
    clearAuthInputs();
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('register-view').style.display = 'block';
}

function switchToLogin() {
    clearAuthInputs();
    document.getElementById('register-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'block';
}

async function submitRegister() {
    const first_name = document.getElementById('reg-firstname').value.trim();
    const last_name = document.getElementById('reg-lastname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    // 1. Check all fields are filled
    if (!first_name || !last_name || !username || !email || !phone || !password) {
        showToast("All fields are required to join the squad.", 'error');
        return;
    }

    // 2. Validate Email
    if (!email.includes('@')) {
        showToast("Please enter a valid email address containing '@'.", 'error');
        return;
    }

    // 3. Validate Phone (Exactly 10 digits, no letters)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
        showToast("Access Denied: Phone number must be exactly 10 digits with no letters.", 'error');
        return;
    }

    const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, username, email, phone, password })
    });

    const data = await res.json();
    if (data.success) {
        showToast('Account created! You can now login.', 'success');
        switchToLogin();
    } else {
        showToast(data.message, 'error');
    }
}

async function submitLogin() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.success) {
        if (data.role === 'admin') {
            window.location.href = '/admin';
        } else {
            location.reload();
        }
    } else {
        showToast(data.message, 'error');
    }
}

async function handleLogout() {
    const res = await fetch('/api/logout');
    const data = await res.json();
    if (data.success) {
        window.location.href = '/';
    }
}

// Check auth status on load
document.addEventListener('DOMContentLoaded', async () => {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    const authBtn = document.getElementById('auth-main-btn');
    
    if (authBtn) {
        if (data.logged_in) {
            authBtn.innerText = 'DISCONNECT';
            authBtn.onclick = handleLogout;
            
            // Add Profile Button if it doesn't exist and user is NOT admin
            if (data.role !== 'admin' && !document.getElementById('profile-nav-btn')) {
                const profileBtn = document.createElement('a');
                profileBtn.id = 'profile-nav-btn';
                profileBtn.href = '/profile';
                profileBtn.className = 'btn-futura';
                profileBtn.innerText = 'PROFILE';
                profileBtn.style.cssText = 'width: auto; padding: 15px 40px; border-color: var(--gold-exact); color: var(--gold-exact); margin-top: 0; text-decoration: none; margin-right: 15px;';
                authBtn.parentNode.insertBefore(profileBtn, authBtn);
            } else if (data.role === 'admin') {
                const pBtn = document.getElementById('profile-nav-btn');
                if(pBtn) pBtn.remove();
            }
        } else {
            authBtn.innerText = 'CONNECT';
            authBtn.onclick = openAuthModal;
            const pBtn = document.getElementById('profile-nav-btn');
            if(pBtn) pBtn.remove();
        }
    }

    // Enter key support for login
    const loginPasswordInput = document.getElementById('login-password');
    if (loginPasswordInput) {
        loginPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitLogin();
            }
        });
    }

    // Enter key support for register
    const regPasswordInput = document.getElementById('reg-password');
    if (regPasswordInput) {
        regPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitRegister();
            }
        });
    }

    // Real-time Phone Restriction (Digits only, max 10)
    const regPhone = document.getElementById('reg-phone');
    if (regPhone) {
        regPhone.addEventListener('input', (e) => {
            // Remove any non-digit characters
            let val = e.target.value.replace(/\D/g, '');
            // Limit to 10 digits
            if (val.length > 10) val = val.slice(0, 10);
            e.target.value = val;
            
            // Visual feedback
            if (val.length === 10) {
                e.target.style.borderColor = 'var(--gold-exact)';
            } else {
                e.target.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            }
        });
    }

    // Real-time Email Validation feedback
    const regEmail = document.getElementById('reg-email');
    if (regEmail) {
        regEmail.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.includes('@') && val.includes('.')) {
                e.target.style.borderColor = 'var(--gold-exact)';
            } else {
                e.target.style.borderColor = 'rgba(255, 0, 0, 0.5)';
            }
        });
    }

    // Click outside to close modal
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAuthModal();
            }
        });
    }
});
