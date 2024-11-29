// frontend/public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            errorMessage.style.display = 'none';
            const response = await api.login({ email, password });
            
            if (response.token) {
                sessionStorage.setItem('token', response.token);
                window.location.href = './dashboard.html';
            }
        } catch (error) {
            errorMessage.textContent = error.message || 'Error al iniciar sesión';
            errorMessage.style.display = 'block';
        }
    });
});

const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', () => {
    // Cambiar el tipo de input entre password y text
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Cambiar el icono
    togglePassword.querySelector('i').classList.toggle('fa-eye');
    togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
});