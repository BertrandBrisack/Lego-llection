// permissions.js - Gestion des permissions d'accès aux menus

function checkUserPermissions() {
    fetch('api/current_user.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const addDropdown = document.getElementById('addDropdown');
            if (!addDropdown) return; // Si le menu n'existe pas sur cette page, quitter
            
            const dropdownItems = document.querySelectorAll('#addDropdown + .dropdown-menu .dropdown-item');
            
            // Griser le menu si:
            // 1. L'utilisateur n'est pas connecté
            // 2. L'utilisateur est connecté avec le rôle "user" (pas owner ou admin)
            const shouldDisable = !data.connected || (data.user && data.user.role === 'user');
            
            if (shouldDisable) {
                // Griser le li du dropdown
                addDropdown.classList.add('disabled');
                addDropdown.style.opacity = '0.5';
                addDropdown.style.pointerEvents = 'none';
                addDropdown.style.cursor = 'not-allowed';
                
                // Ajouter un tooltip
                addDropdown.title = !data.connected 
                    ? 'Veuillez vous connecter pour ajouter'
                    : 'Seuls les propriétaires (owner) peuvent ajouter';
                
                // Désactiver les liens du dropdown
                dropdownItems.forEach(item => {
                    item.classList.add('disabled');
                    item.style.pointerEvents = 'none';
                    item.style.opacity = '0.5';
                });
            }
        })
        .catch(error => {
            console.error('Error checking user permissions:', error);
            // En cas d'erreur, désactiver par défaut
            const addDropdown = document.getElementById('addDropdown');
            if (addDropdown) {
                addDropdown.style.opacity = '0.5';
                addDropdown.style.pointerEvents = 'none';
                addDropdown.title = 'Impossible de vérifier les permissions';
            }
        });
}
