// Gestion de l'authentification côté client
const Auth = {
    // Vérifier si l'utilisateur est connecté
    isAuthenticated() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return token && user;
    },

    // Récupérer le token
    getToken() {
        return localStorage.getItem('token');
    },

    // Récupérer l'utilisateur
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Connexion
    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }

            // Stocker le token et les informations utilisateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return data;
        } catch (error) {
            throw error;
        }
    },

    // Déconnexion
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    },

    // Vérifier l'état d'authentification au chargement
    checkAuth() {
        if (this.isAuthenticated()) {
            this.showMainPage();
        } else {
            this.showLoginPage();
        }
    },

    // Afficher la page de connexion
    showLoginPage() {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainPage').style.display = 'none';
    },

    // Afficher la page principale
    showMainPage() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainPage').style.display = 'block';
        
        const user = this.getUser();
        if (user) {
            document.getElementById('userDisplay').textContent = 
                `${user.username} (${user.role})`;
            
            // Charger les données
            if (typeof App !== 'undefined') {
                App.init();
            }
        }
    }
};

// Gestion du formulaire de connexion
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Désactiver le bouton pendant la requête
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connexion...';
        loginError.style.display = 'none';

        try {
            await Auth.login(username, password);
            Auth.showMainPage();
        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Se connecter';
        }
    });

    // Vérifier l'authentification au chargement
    Auth.checkAuth();
});
