// Dynamic API base URL - works with localhost, ngrok, and other domains
const API_URL = window.location.origin;
const API_BASE = API_URL + '/api';


function openAdminModal() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; 
    clearModalMessages();
}

function clearModalMessages() {
    document.getElementById('modalErrorMessage').style.display = 'none';
    document.getElementById('modalLoadingMessage').style.display = 'none';
}


function showModalError(message) {
    const errorDiv = document.getElementById('modalErrorMessage');
    const loadingDiv = document.getElementById('modalLoadingMessage');
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
}


function showModalLoading() {
    const loadingDiv = document.getElementById('modalLoadingMessage');
    const errorDiv = document.getElementById('modalErrorMessage');
    
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
}


function showForm(formId) {
    console.log('Showing form:', formId); 
    const forms = document.querySelectorAll('.form');
    const targetForm = document.getElementById(formId);
    
    if (!targetForm) {
        console.error('Form not found:', formId);
        return;
    }
    
    forms.forEach(form => {
        if (form.id === formId) {
            form.classList.remove('hidden');
            console.log('Form shown:', formId);
        } else {
            form.classList.add('hidden');
        }
    });
}



function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const loadingDiv = document.getElementById('loadingMessage');
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
}


function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    const errorDiv = document.getElementById('errorMessage');
    const loadingDiv = document.getElementById('loadingMessage');
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
}


function showLoading() {
    const loadingDiv = document.getElementById('loadingMessage');
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    loadingDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
}


document.addEventListener('DOMContentLoaded', function() {

        // Forgot Password Modal logic
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');

        forgotPasswordBtn.addEventListener('click', function() {
            forgotPasswordModal.style.display = 'flex';
            forgotPasswordMessage.textContent = '';
            document.getElementById('forgotEmail').value = '';
        });
        closeForgotPasswordModal.addEventListener('click', function() {
            forgotPasswordModal.style.display = 'none';
        });
        window.addEventListener('click', function(event) {
            if (event.target === forgotPasswordModal) {
                forgotPasswordModal.style.display = 'none';
            }
        });
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && forgotPasswordModal.style.display === 'flex') {
                forgotPasswordModal.style.display = 'none';
            }
        });

        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            forgotPasswordMessage.style.color = '#b94a48';
            forgotPasswordMessage.innerHTML = '<span class="loading-spinner" style="display:inline-block;width:1.5em;height:1.5em;border:3px solid #ccc;border-top:3px solid #8b7355;border-radius:50%;animation:spin 1s linear infinite;vertical-align:middle;margin-right:0.5em;"></span>Processing...';
            const email = document.getElementById('forgotEmail').value;
            try {
                const response = await fetch(`${API_BASE}/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    forgotPasswordMessage.style.color = '#28a745';
                    forgotPasswordMessage.textContent = 'A new password has been sent to your email.';
                    setTimeout(() => { forgotPasswordModal.style.display = 'none'; }, 2000);
                } else {
                    forgotPasswordMessage.style.color = '#b94a48';
                    forgotPasswordMessage.textContent = data.error || 'Email not found.';
                }
            } catch (err) {
                forgotPasswordMessage.style.color = '#b94a48';
                forgotPasswordMessage.textContent = 'An error occurred. Please try again.';
            }
        });
    
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const adminModal = document.getElementById('adminModal');
    
    
    adminLoginBtn.addEventListener('click', openAdminModal);
    
    
    closeModalBtn.addEventListener('click', closeAdminModal);
    
    
    window.addEventListener('click', function(event) {
        if (event.target === adminModal) {
            closeAdminModal();
        }
    });
    
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && adminModal.style.display === 'block') {
            closeAdminModal();
        }
    });

    
    document.getElementById('staffLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        try {
            const response = await fetch(`${API_BASE}/auth/login/staff`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                showSuccess('Login successful! Redirecting...');
                setTimeout(() => {
                    
                    if (result.user.role === 'customer') {
                        window.location.href = './customer-dashboard.html';
                    } else {
                        window.location.href = './staff-dashboard.html';
                    }
                }, 1000);
            } else {
                showError(result.error || 'Login failed');
            }
        } catch (error) {
            showError('Network error. Please try again.');
        }
    });
    
    
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showModalLoading();
        
        const formData = new FormData(e.target);
        const password = formData.get('password');
        
        
        if (password === 'admin123') {
            
            const adminUser = {
                id: 'admin',
                email: 'admin@feedsstore.com',
                firstName: 'Store',
                lastName: 'Admin',
                role: 'admin'
            };
            
            
            localStorage.setItem('token', 'admin_token_' + Date.now());
            localStorage.setItem('user', JSON.stringify(adminUser));
            localStorage.setItem('isAdmin', 'true'); 
            
            closeAdminModal();
            showSuccess('Admin login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = './admin-dashboard.html';
            }, 1000);
        } else {
            showModalError('Invalid admin password.');
        }
    });
    
});
