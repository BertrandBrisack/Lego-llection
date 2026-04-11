document.addEventListener('DOMContentLoaded', function () {
    if (typeof checkUserPermissions === 'function') {
        checkUserPermissions();
    }

    if (typeof initializeProfileMenu === 'function') {
        initializeProfileMenu();
    }

    const view = getViewMode();
    updatePageHeader(view);
    highlightCurrentView(view);
    loadCollection(view);
});

function getViewMode() {
    const view = new URLSearchParams(window.location.search).get('view');
    return view === 'borrows' ? 'borrows' : 'mine';
}

function updatePageHeader(view) {
    const title = document.getElementById('pageTitle');
    const description = document.getElementById('pageDescription');

    if (view === 'borrows') {
        document.title = "Mes emprunts - Lego'llection";
        title.textContent = 'Mes emprunts';
        description.textContent = 'Retrouvez ici tous les sets que vous avez actuellement empruntés.';
    } else {
        document.title = "Ma Collection - Lego'llection";
        title.textContent = 'Ma Collection';
        description.textContent = 'Cette page regroupe tous les sets dont vous êtes propriétaire.';
    }
}

function highlightCurrentView(view) {
    const myCollectionLink = document.getElementById('myCollectionLink');
    const myBorrowsLink = document.getElementById('myBorrowsLink');

    if (view === 'borrows') {
        myBorrowsLink?.classList.add('active');
    } else {
        myCollectionLink?.classList.add('active');
    }
}

async function loadCollection(view) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');

    loadingIndicator.classList.remove('d-none');
    resultsList.innerHTML = '';
    resultsCount.innerHTML = '';
    clearMessage();

    try {
        const currentUserResponse = await fetch('../backend/api/current_user.php', { credentials: 'include' });
        const currentUserData = await currentUserResponse.json();

        if (!currentUserData.connected || !currentUserData.user) {
            showMessage('warning', 'Vous devez être connecté pour consulter cette page. <a href="login.html" class="alert-link">Se connecter</a>.');
            loadingIndicator.classList.add('d-none');
            return;
        }

        const currentUserRole = String(currentUserData.user.role || '').trim().toLowerCase();

        if (view === 'mine' && currentUserRole !== 'owner') {
            showMessage('danger', 'La page <strong>Ma Collection</strong> est réservée aux utilisateurs ayant le rôle <strong>owner</strong>.');
            loadingIndicator.classList.add('d-none');
            return;
        }

        const response = await fetch(`../backend/api/collection_sets.php?view=${encodeURIComponent(view)}`, { credentials: 'include' });
        const data = await response.json();

        loadingIndicator.classList.add('d-none');

        if (!response.ok || !data.success) {
            showMessage('danger', escapeHtml(data.error || 'Impossible de charger les données.'));
            return;
        }

        resultsCount.innerHTML = `<p class="text-muted"><strong>${data.total}</strong> set(s) trouvé(s)</p>`;

        if (!data.sets || data.sets.length === 0) {
            resultsList.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info mb-0">
                        ${view === 'borrows'
                            ? 'Vous n\'avez actuellement aucun set emprunté.'
                            : 'Vous n\'avez encore aucun set dans votre collection.'}
                    </div>
                </div>
            `;
            return;
        }

        resultsList.innerHTML = data.sets.map(set => renderSetCard(set, view)).join('');
        attachActionListeners(view);
    } catch (error) {
        console.error('Erreur lors du chargement de la collection :', error);
        loadingIndicator.classList.add('d-none');
        showMessage('danger', 'Une erreur est survenue lors du chargement de cette page.');
    }
}

function renderSetCard(set, view) {
    const locationParts = [set.site_nom, set.local_nom, set.rangement_nom, set.niveau_nom].filter(Boolean);
    const dateText = formatDate(set.date);
    const ownerName = (set.proprietaire_login || [set.proprietaire_prenom, set.proprietaire_nom].filter(Boolean).join(' ').trim()).trim();
    const borrowerName = (set.emprunteur_login || [set.emprunteur_prenom, set.emprunteur_nom].filter(Boolean).join(' ').trim()).trim();
    const badgeClass = set.statut && set.statut.toLowerCase().includes('disponible') ? 'bg-success' : 'bg-warning text-dark';
    const detailUrl = `set.html?id=${encodeURIComponent(set.idObjet || '')}`;
    const actionButtons = `
        <div class="mt-3 d-flex flex-wrap gap-2">
            <a href="${detailUrl}" class="btn btn-outline-secondary btn-sm detail-link">Voir la fiche</a>
            ${view === 'borrows'
                ? `<button type="button" class="btn btn-outline-primary btn-sm return-btn" data-id="${escapeHtml(set.idObjet || '')}">Rendre</button>`
                : ''}
        </div>
    `;

    const imagePath = getBestSetImagePath(set);

    return `
        <div class="col-md-6 col-xl-4">
            <div class="card h-100 shadow-sm set-card-clickable" data-set-id="${escapeHtml(set.idObjet || '')}" tabindex="0" role="link" style="cursor:pointer;">
                ${imagePath ? `<img src="${escapeHtml(resolveImagePath(imagePath))}" class="card-img-top set-image" alt="${escapeHtml(set.nom)}">` : '<div class="card-img-top set-image d-flex align-items-center justify-content-center text-muted">Aucune image</div>'}
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <h5 class="card-title mb-2">${escapeHtml(set.nom || 'Set sans nom')}</h5>
                        <span class="badge ${badgeClass}">${escapeHtml(set.statut || 'Inconnu')}</span>
                    </div>

                    ${set.collection ? `<p class="mb-2"><strong>Collection :</strong> ${escapeHtml(set.collection)}</p>` : ''}
                    ${set.infoPlus ? `<p class="card-text">${escapeHtml(set.infoPlus)}</p>` : ''}

                    <ul class="list-unstyled small text-muted mt-auto mb-0">
                        ${ownerName ? `<li><strong>Propriétaire :</strong> ${escapeHtml(ownerName)}</li>` : ''}
                        ${view === 'mine' && borrowerName ? `<li><strong>Emprunté par :</strong> ${escapeHtml(borrowerName)}</li>` : ''}
                        ${dateText ? `<li><strong>Date :</strong> ${escapeHtml(dateText)}</li>` : ''}
                        ${locationParts.length ? `<li><strong>Emplacement :</strong> ${escapeHtml(locationParts.join(' > '))}</li>` : ''}
                    </ul>

                    <p class="mt-3 mb-2 text-primary small">Cliquez pour voir la fiche complète</p>
                    ${actionButtons}
                </div>
            </div>
        </div>
    `;
}

function attachActionListeners(view) {
    document.querySelectorAll('.detail-link').forEach(link => {
        link.addEventListener('click', function (event) {
            event.stopPropagation();
        });
    });

    document.querySelectorAll('.set-card-clickable[data-set-id]').forEach(card => {
        card.addEventListener('click', function (event) {
            if (event.target.closest('button, a')) {
                return;
            }

            const setId = this.getAttribute('data-set-id');
            if (setId) {
                window.location.href = `set.html?id=${encodeURIComponent(setId)}`;
            }
        });

        card.addEventListener('keydown', function (event) {
            if (event.target.closest('button, a')) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const setId = this.getAttribute('data-set-id');
                if (setId) {
                    window.location.href = `set.html?id=${encodeURIComponent(setId)}`;
                }
            }
        });
    });

    if (view !== 'borrows') {
        return;
    }

    document.querySelectorAll('.return-btn').forEach(button => {
        button.addEventListener('click', async function (event) {
            event.stopPropagation();
            const setId = this.getAttribute('data-id');
            await returnSet(setId, this);
        });
    });
}

async function returnSet(setId, button) {
    if (!setId) {
        return;
    }

    const confirmed = window.confirm('Confirmer le retour de ce set à son propriétaire ?');
    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = 'Retour...';
    clearMessage();

    try {
        const formData = new FormData();
        formData.append('idObjet', setId);

        const response = await fetch('../backend/api/return_set.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Impossible de rendre ce set pour le moment.');
        }

        await loadCollection('borrows');
        showMessage('success', escapeHtml(data.message || 'Le set a bien été rendu à son propriétaire.'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Erreur lors du retour du set :', error);
        showMessage('danger', escapeHtml(error.message || 'Une erreur est survenue lors du retour du set.'));
        button.disabled = false;
        button.textContent = 'Rendre';
    }
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

function showMessage(type, html) {
    const container = document.getElementById('messageContainer');
    container.innerHTML = `<div class="alert alert-${type}" role="alert">${html}</div>`;
}

function clearMessage() {
    document.getElementById('messageContainer').innerHTML = '';
}

function getBestSetImagePath(set) {
    return set.photo || set.niveau_photo || set.rangement_photo || set.local_photo || set.site_photo || '';
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function resolveImagePath(path) {
    if (!path) return '';
    const trimmed = String(path).trim();

    if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        return trimmed;
    }

    try {
        return new URL(trimmed, window.location.href).href;
    } catch {
        return trimmed;
    }
}
