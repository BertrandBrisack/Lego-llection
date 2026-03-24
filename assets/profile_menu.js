// profile_menu.js - Gestion du menu profil et déconnexion

function initializeProfileMenu() {
    fetch('api/current_user.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const profileLink = document.getElementById('profileLink');
            const profileMenuContainer = document.getElementById('profileMenuContainer');
            
            if (!profileLink || !profileMenuContainer) return;
            
            if (data.connected && data.user) {
                // Utilisateur connecté: afficher le menu déroulant
                profileMenuContainer.innerHTML = `
                    <div class="dropdown">
                        <button class="btn btn-link dropdown-toggle p-0" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false" style="text-decoration: none; border: none; background: none; cursor: pointer;">
                            <img src="./assets/ProfilParDefaut.png" class="rounded-circle" alt="Photo de profil" width="40" height="40">
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                            <li><span class="dropdown-header">${escapeHtml(data.user.prenomUtilisateur)} ${escapeHtml(data.user.nomUtilisateur)}</span></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="profile.html">👤 Espace personnel</a></li>
                            <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">🚪 Se déconnecter</a></li>
                        </ul>
                    </div>
                `;
                
                // Ajouter l'événement de déconnexion après la création du DOM
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        logout();
                    });
                }
            } else {
                // Utilisateur non connecté: afficher le lien de connexion
                profileMenuContainer.innerHTML = `
                    <a href="login.html">
                        <img src="./assets/ProfilParDefaut.png" class="rounded-circle" alt="Photo de profil" width="40" height="40">
                    </a>
                `;
            }
        })
        .catch(error => {
            console.error('Error initializing profile menu:', error);
            // En cas d'erreur, afficher le lien de connexion
            const profileMenuContainer = document.getElementById('profileMenuContainer');
            if (profileMenuContainer) {
                profileMenuContainer.innerHTML = `
                    <a href="login.html">
                        <img src="./assets/ProfilParDefaut.png" class="rounded-circle" alt="Photo de profil" width="40" height="40">
                    </a>
                `;
            }
        });
}

function logout() {
    fetch('api/logout.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Rediriger vers la page de connexion
            window.location.href = 'login.html';
        } else {
            alert('Erreur lors de la déconnexion');
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Erreur de connexion lors de la déconnexion');
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, m => map[m]) : '';
}
