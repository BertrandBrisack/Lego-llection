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

            // Gestion individuelle des items du menu "Ajouter"
            const addSiteLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_site.html"]');
            const addLocalLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_local.html"]');
            const addRangementLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_rangement.html"]');
            const addNiveauLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_niveau.html"]');
            const addSetLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_set.html"]');
            const addCollectionLink = document.querySelector('#addDropdown + .dropdown-menu .dropdown-item[href="add_collection.html"]');

            // Items réservés aux owners
            const ownerItems = [addSiteLink, addLocalLink, addRangementLink, addNiveauLink, addSetLink].filter(Boolean);
            const shouldDisableOwnerItems = !isConnected || userRole !== 'owner';
            setDisabledState(
                null, // Pas de trigger pour ces items
                ownerItems,
                shouldDisableOwnerItems,
                !isConnected
                    ? 'Veuillez vous connecter pour ajouter'
                    : 'Seuls les owners peuvent ajouter ces éléments'
            );

            // Item réservé aux admins : Collection
            const shouldDisableCollection = !isConnected || userRole !== 'admin';
            setDisabledState(
                null,
                [addCollectionLink].filter(Boolean),
                shouldDisableCollection,
                !isConnected
                    ? 'Veuillez vous connecter pour ajouter une collection'
                    : 'Seuls les administrateurs peuvent ajouter des collections. Contactez bertrand.brisack@gmail.com pour suggérer un ajout de collection.'
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
        trigger.style.pointerEvents = 'auto'; // Toujours permettre les événements pour le survol
        trigger.style.cursor = disabled ? 'not-allowed' : 'pointer';
        trigger.title = title;
        
        if (disabled) {
            trigger.setAttribute('data-bs-toggle', 'tooltip');
            trigger.setAttribute('data-bs-placement', 'right');
            trigger.addEventListener('click', preventAction);
        } else {
            trigger.removeAttribute('data-bs-toggle');
            trigger.removeAttribute('data-bs-placement');
            trigger.removeEventListener('click', preventAction);
        }
    }

    Array.from(items || []).filter(Boolean).forEach(item => {
        item.classList.toggle('disabled', disabled);
        item.style.pointerEvents = 'auto'; // Toujours permettre les événements
        item.style.opacity = disabled ? '0.5' : '1';
        item.title = title;
        
        if (disabled) {
            item.setAttribute('data-bs-toggle', 'tooltip');
            item.setAttribute('data-bs-placement', 'right');
            item.addEventListener('click', preventAction);
        } else {
            item.removeAttribute('data-bs-toggle');
            item.removeAttribute('data-bs-placement');
            item.removeEventListener('click', preventAction);
        }
    });
    
    // Initialiser les tooltips Bootstrap après modification
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

function preventAction(e) {
    e.preventDefault();
    e.stopPropagation();
    // Pas d'alerte, juste empêcher l'action
}

