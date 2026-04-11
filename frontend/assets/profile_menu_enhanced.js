/**
 * ============================================================================
 * PROFILE_MENU.JS
 * Gestion du menu profil et authentification
 * 
 * Responsabilités:
 * - Afficher le menu profil pour les utilisateurs connectés
 * - Afficher le lien de connexion pour les utilisateurs non connectés
 * - Gérer la déconnexion
 * - Sécuriser l'affichage (XSS prevention)
 * ============================================================================
 */

/**
 * Initialiser le menu profil au chargement de la page
 * 
 * @description
 * - Fetch les informations de l'utilisateur current
 * - Affiche le menu déroulant si connecté
 * - Affiche le lien de connexion si non connecté
 * - Gère les erreurs de fetch
 * 
 * @fire DOMContentLoaded recommandé
 */
function initializeProfileMenu() {
    const profileMenuContainer = document.getElementById('profileMenuContainer');
    
    // Vérifier que le conteneur existe
    if (!profileMenuContainer) {
        console.warn('Profile menu container not found with id: profileMenuContainer');
        return;
    }
    
    // Fetch les données de l'utilisateur actuel
    fetch('../backend/api/current_user.php', {
        credentials: 'include' // Important: inclure les cookies de session
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.connected && data.user) {
            // ========================================
            // UTILISATEUR CONNECTÉ
            // Afficher le menu déroulant
            // ========================================
            profileMenuContainer.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-link dropdown-toggle p-0" 
                            type="button" 
                            id="profileDropdown" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false" 
                            style="text-decoration: none; border: none; background: none; cursor: pointer;">
                        <img src="./assets/ProfilParDefaut.png" 
                             class="rounded-circle" 
                             alt="Photo de profil" 
                             width="40" 
                             height="40"
                             title="Menu profil">
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="profileDropdown">
                        <!-- Afficher le nom de l'utilisateur -->
                        <li>
                            <span class="dropdown-header">
                                <strong>${escapeHtml(data.user.prenomUtilisateur)}</strong><br>
                                ${escapeHtml(data.user.nomUtilisateur)}
                            </span>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        
                        <!-- Rôle de l'utilisateur (info additionnelle) -->
                        <li>
                            <span class="dropdown-header d-block text-muted" style="font-size: 0.875rem;">
                                Rôle: <span class="badge bg-info">${escapeHtml(data.user.role)}</span>
                            </span>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        
                        <!-- Lien vers le profil utilisateur -->
                        <li>
                            <a class="dropdown-item" href="profile.html">
                                👤 Espace personnel
                            </a>
                        </li>
                        
                        <!-- Bouton de déconnexion -->
                        <li>
                            <a class="dropdown-item text-danger" 
                               href="#" 
                               id="logoutBtn"
                               style="cursor: pointer;">
                                🚪 Se déconnecter
                            </a>
                        </li>
                    </ul>
                </div>
            `;
            
            // Ajouter l'événement de déconnexion
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    logout();
                });
            }
            
        } else {
            // ========================================
            // UTILISATEUR NON CONNECTÉ
            // Afficher le lien de connexion
            // ========================================
            profileMenuContainer.innerHTML = `
                <a href="login.html" title="Se connecter">
                    <img src="./assets/ProfilParDefaut.png" 
                         class="rounded-circle" 
                         alt="Photo de profil" 
                         width="40" 
                         height="40">
                </a>
            `;
        }
    })
    .catch(error => {
        console.error('Error initializing profile menu:', error);
        
        // En cas d'erreur, afficher le lien de connexion par défaut
        const profileMenuContainer = document.getElementById('profileMenuContainer');
        if (profileMenuContainer) {
            profileMenuContainer.innerHTML = `
                <a href="login.html" title="Se connecter">
                    <img src="./assets/ProfilParDefaut.png" 
                         class="rounded-circle" 
                         alt="Photo de profil par défaut" 
                         width="40" 
                         height="40">
                </a>
            `;
        }
    });
}

/**
 * Déconnecter l'utilisateur
 * 
 * @description
 * - Appelle l'API de déconnexion
 * - Détruit la session côté serveur
 * - Redirige vers la page de connexion
 * - Affiche un message d'erreur en cas de problème
 */
function logout() {
    // Désactiver le bouton pendant la déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = '⏳ Déconnexion...';
    }
    
    fetch('../backend/api/logout.php', {
        method: 'GET',
        credentials: 'include' // Important: inclure les cookies pour la déconnexion
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Rediriger vers la page de connexion après succès
            window.location.href = 'login.html';
        } else {
            // Erreur du serveur
            alert('Erreur lors de la déconnexion: ' + (data.message || 'Erreur inconnue'));
            
            // Réactiver le bouton
            if (logoutBtn) {
                logoutBtn.disabled = false;
                logoutBtn.textContent = '🚪 Se déconnecter';
            }
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Erreur de connexion lors de la déconnexion: ' + error.message);
        
        // Réactiver le bouton
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = '🚪 Se déconnecter';
        }
    });
}

/**
 * Échapper les caractères HTML pour éviter les injections XSS
 * 
 * @param {string} text - Texte à échapper
 * @return {string} Texte échappé sûr pour l'HTML
 * 
 * @description
 * Remplace les caractères HTML spéciaux par leurs entités correspondantes
 * Mesure de sécurité importante pour l'affichage de contenu utilisateur
 */
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

/**
 * INITIALISATION AUTOMATIQUE
 * 
 * Note: initializeProfileMenu() doit être appelée dans chaque page HTML
 * via un événement DOMContentLoaded pour assurer que tous les éléments DOM
 * sont disponibles.
 * 
 * Exemple d'utilisation dans index.html:
 * 
 * <script src="assets/profile_menu.js"></script>
 * <script>
 *     document.addEventListener('DOMContentLoaded', function() {
 *         initializeProfileMenu();
 *     });
 * </script>
 */

// ============================================================================
// ÉVÉNEMENTS ET HOOKS DISPONIBLES
// ============================================================================

/**
 * Hook: Avant la déconnexion
 * Note: Non implémenté actuellement
 * À implémenter si besoin de confirmer avant déconnexion
 */
function beforeLogout() {
    // Exemple: Sauvegarder des données, afficher une confirmation, etc.
    return confirm('Êtes-vous sûr de vouloir vous déconnecter?');
}

/**
 * Hook: Après la déconnexion réussie
 * Note: Actuellement gérée par redirection
 * À customiser si besoin d'actions supplémentaires
 */
function afterLogoutSuccess() {
    console.log('Logout successful, redirecting...');
}

// ============================================================================
