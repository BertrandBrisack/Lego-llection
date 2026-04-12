// permissions.js - Gestion des permissions d'accès aux menus

function checkUserPermissions() {
    fetch('backend/api/current_user.php', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            const isConnected = !!data.connected;
            const userRole = String(data.user?.role || '').trim().toLowerCase();
            const userId = data.user?.idUtilisateur || '';

            const addDropdown = document.getElementById('addDropdown');
            const addDropdownItems = document.querySelectorAll('#addDropdown + .dropdown-menu .dropdown-item');
            const collectionDropdown = document.getElementById('collectionDropdown');
            const myCollectionLink = document.getElementById('myCollectionLink');
            const myBorrowsLink = document.getElementById('myBorrowsLink');
            const adminMenuContainer = document.getElementById('adminMenuContainer');

            // Gestion du menu Admin - visible uniquement pour l'utilisateur admin
            if (adminMenuContainer) {
                const isAdmin = isConnected && userRole === 'admin';
                adminMenuContainer.style.display = isAdmin ? 'block' : 'none';
            }

            const shouldDisableAdd = !isConnected || userRole !== 'owner';
            setDisabledState(
                addDropdown,
                addDropdownItems,
                shouldDisableAdd,
                !isConnected
                    ? 'Veuillez vous connecter pour ajouter'
                    : 'Seuls les owners peuvent ajouter'
            );

            if (!isConnected) {
                setDisabledState(
                    collectionDropdown,
                    [myCollectionLink, myBorrowsLink],
                    true,
                    'Veuillez vous connecter pour accéder à votre collection et à vos emprunts'
                );
                return;
            }

            setDisabledState(collectionDropdown, [myCollectionLink, myBorrowsLink], false, '');

            if (myCollectionLink) {
                const ownerOnly = userRole !== 'owner';
                myCollectionLink.classList.toggle('disabled', ownerOnly);
                myCollectionLink.style.pointerEvents = ownerOnly ? 'none' : 'auto';
                myCollectionLink.style.opacity = ownerOnly ? '0.5' : '1';
                myCollectionLink.title = ownerOnly ? 'Accès réservé aux owners' : '';
            }

            if (myBorrowsLink) {
                myBorrowsLink.classList.remove('disabled');
                myBorrowsLink.style.pointerEvents = 'auto';
                myBorrowsLink.style.opacity = '1';
                myBorrowsLink.title = '';
            }
        })
        .catch(error => {
            console.error('Error checking user permissions:', error);

            const addDropdown = document.getElementById('addDropdown');
            const collectionDropdown = document.getElementById('collectionDropdown');
            const adminMenuContainer = document.getElementById('adminMenuContainer');

            if (adminMenuContainer) {
                adminMenuContainer.style.display = 'none';
            }

            setDisabledState(addDropdown, document.querySelectorAll('#addDropdown + .dropdown-menu .dropdown-item'), true, 'Impossible de vérifier les permissions');
            setDisabledState(collectionDropdown, [document.getElementById('myCollectionLink'), document.getElementById('myBorrowsLink')], true, 'Impossible de vérifier les permissions');
        });
}

function setDisabledState(trigger, items, disabled, title = '') {
    if (trigger) {
        trigger.classList.toggle('disabled', disabled);
        trigger.style.opacity = disabled ? '0.5' : '1';
        trigger.style.pointerEvents = disabled ? 'none' : 'auto';
        trigger.style.cursor = disabled ? 'not-allowed' : 'pointer';
        trigger.title = title;
    }

    Array.from(items || []).filter(Boolean).forEach(item => {
        item.classList.toggle('disabled', disabled);
        item.style.pointerEvents = disabled ? 'none' : 'auto';
        item.style.opacity = disabled ? '0.5' : '1';
        item.title = title;
    });
}

