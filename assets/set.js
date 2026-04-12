let currentUser = null;
let availableNiveaux = [];
let currentSetId = null;

document.addEventListener('DOMContentLoaded', function () {
    if (typeof checkUserPermissions === 'function') {
        checkUserPermissions();
    }

    if (typeof initializeProfileMenu === 'function') {
        initializeProfileMenu();
    }

    loadCurrentUser().then(loadSetDetails);
});

async function loadCurrentUser() {
    try {
        const response = await fetch('backend/api/current_user.php', { credentials: 'include' });
        const data = await response.json();
        currentUser = data.connected && data.user ? data.user : null;
        return currentUser;
    } catch (error) {
        console.error('Erreur lors du chargement de l’utilisateur :', error);
        currentUser = null;
        return null;
    }
}

async function loadSetDetails() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const content = document.getElementById('setDetailContent');
    const setId = new URLSearchParams(window.location.search).get('id');

    if (!setId) {
        loadingIndicator.classList.add('d-none');
        showMessage('danger', 'Aucun set sélectionné.');
        return;
    }

    try {
        const response = await fetch(`backend/api/set_details.php?id=${encodeURIComponent(setId)}`, {
            credentials: 'include'
        });
        const data = await response.json();

        loadingIndicator.classList.add('d-none');

        if (!response.ok || !data.success || !data.set) {
            showMessage('danger', escapeHtml(data.error || 'Impossible de charger ce set.'));
            return;
        }

        currentSetId = data.set.idObjet || null;

        if (currentUser && currentUser.role === 'owner' && String(currentUser.idUtilisateur) === String(data.set.idOwner)) {
            availableNiveaux = await fetchOwnerNiveaux();
        } else {
            availableNiveaux = [];
        }

        renderSetDetails(data.set);
        attachMoveSetHandler();
        attachUpdateImageHandler();
    } catch (error) {
        console.error('Erreur lors du chargement du détail du set :', error);
        loadingIndicator.classList.add('d-none');
        content.innerHTML = '';
        showMessage('danger', 'Une erreur est survenue lors du chargement du set.');
    }
}

async function fetchOwnerNiveaux() {
    try {
        const response = await fetch('backend/api/niveaux.php?mine=1', { credentials: 'include' });
        const data = await response.json();
        return data.success && Array.isArray(data.niveaux) ? data.niveaux : [];
    } catch (error) {
        console.error('Erreur lors du chargement des niveaux :', error);
        return [];
    }
}

function attachMoveSetHandler() {
    const form = document.getElementById('moveSetForm');
    if (form) {
        form.removeEventListener('submit', submitSetLocationUpdate);
        form.addEventListener('submit', submitSetLocationUpdate);
    }

    const deleteBtn = document.getElementById('deleteSetBtn');
    if (deleteBtn) {
        deleteBtn.removeEventListener('click', handleDeleteSet);
        deleteBtn.addEventListener('click', handleDeleteSet);
    }
}

async function handleDeleteSet(event) {
    event.preventDefault();
    const setId = event.currentTarget.dataset.setId;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce set ? Cette action est irréversible.')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('idObjet', setId);

        const response = await fetch('backend/api/delete_set.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Impossible de supprimer le set.');
        }

        showMessage('success', 'Set supprimé avec succès. Redirection...');
        window.setTimeout(() => {
            window.location.href = 'collection.html?view=mine';
        }, 1500);
    } catch (error) {
        console.error('Erreur lors de la suppression du set :', error);
        showMessage('danger', escapeHtml(error.message || 'Impossible de supprimer le set.'));
    }
}

async function submitSetLocationUpdate(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.getElementById('messageContainer');
    const formData = new FormData(form);

    try {
        const response = await fetch('backend/api/update_set_location.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Impossible de déplacer le set.');
        }

        showMessage('success', 'Emplacement du set mis à jour.');
        await loadSetDetails();
    } catch (error) {
        console.error('Erreur lors du déplacement du set :', error);
        showMessage('danger', escapeHtml(error.message || 'Impossible de déplacer le set.'));
    }
}

function attachUpdateImageHandler() {
    const form = document.getElementById('updateSetImageForm');
    if (!form) {
        return;
    }

    initializePhotoUpload();
    form.removeEventListener('submit', submitSetImageUpdate);
    form.addEventListener('submit', submitSetImageUpdate);
}

async function submitSetImageUpdate(event) {
    event.preventDefault();
    const form = event.currentTarget;

    await handleFormWithImageUploadDetailed(form, 'backend/api/update_set_image.php', 'photoType', 'photo', 'photoFile', (data) => {
        showMessage('success', data.message || 'Image du set mise à jour avec succès.');
        form.reset();
        resetPhotoFields();
        loadSetDetails();
    }, (message) => {
        showMessage('danger', message || 'Impossible de mettre à jour l’image du set.');
    });
}

function renderSetDetails(set) {
    const content = document.getElementById('setDetailContent');
    const ownerName = (set.proprietaire_login || [set.proprietaire_prenom, set.proprietaire_nom].filter(Boolean).join(' ').trim()).trim();
    const borrowerName = (set.emprunteur_login || [set.emprunteur_prenom, set.emprunteur_nom].filter(Boolean).join(' ').trim()).trim();
    const siteAddress = [
        set.site_adresse,
        [set.site_code_postal, set.site_localite].filter(Boolean).join(' ')
    ].filter(Boolean).join(', ');
    const canEditLocation = currentUser && currentUser.role === 'owner' && String(currentUser.idUtilisateur) === String(set.idOwner);
    const niveauOptions = availableNiveaux.map(niveau => `
        <option value="${escapeHtml(niveau.idNiveau)}" ${String(niveau.idNiveau) === String(set.idNiveau) ? 'selected' : ''}>
            ${escapeHtml(`${niveau.nom || 'Sans nom'} (${niveau.rangement_nom || 'N/A'}, ${niveau.local_nom || 'N/A'}, ${niveau.site_nom || 'N/A'})`)}
        </option>
    `).join('');

    const updateImageMarkup = canEditLocation ? `
        <div class="card mt-4">
            <div class="card-body">
                <h2 class="h6 mb-3">Modifier l'image du set</h2>
                <form id="updateSetImageForm" class="row g-3 align-items-end">
                    <input type="hidden" name="idObjet" value="${escapeHtml(set.idObjet || '')}">
                    <div class="col-12">
                        <label class="form-label">Photo</label>
                        <div class="photo-options d-flex gap-3 mb-2">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="photoType" id="photoUrl" value="url" checked>
                                <label class="form-check-label" for="photoUrl">URL de l'image</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="photoType" id="photoUpload" value="upload">
                                <label class="form-check-label" for="photoUpload">Uploader une image</label>
                            </div>
                        </div>
                        <div id="photoUrlContainer">
                            <input type="text" class="form-control" id="photo" name="photo" placeholder="https://exemple.com/image.jpg" required>
                            <div id="photoPreview" class="mt-2" style="display: none;">
                                <img src="" alt="Aperçu" class="img-thumbnail" style="max-width: 200px; max-height: 200px;">
                                <small class="text-muted">Aperçu de l'image</small>
                            </div>
                        </div>
                        <div id="photoUploadContainer" style="display: none;">
                            <input type="file" class="form-control" id="photoFile" name="photoFile" accept="image/*">
                            <div class="form-text">Formats acceptés: JPG, PNG, GIF, WebP. Taille max: 5MB. Choisissez depuis la galerie ou le gestionnaire de fichiers.</div>
                        </div>
                    </div>
                    <div class="col-12 text-end">
                        <button type="submit" class="btn btn-primary">Mettre à jour l'image</button>
                    </div>
                </form>
            </div>
        </div>` : '';

    const moveFormMarkup = canEditLocation ? `
        <div class="card mt-4">
            <div class="card-body">
                <h2 class="h6 mb-3">Modifier l'emplacement du set</h2>
                <form id="moveSetForm" class="row g-3 align-items-end">
                    <input type="hidden" name="idObjet" value="${escapeHtml(set.idObjet || '')}">
                    <div class="col-md-8">
                        <label class="form-label" for="moveSetNiveau">Niveau</label>
                        <select id="moveSetNiveau" name="idNiveau" class="form-select" ${availableNiveaux.length === 0 ? 'disabled' : 'required'}>
                            <option value="_none" ${!set.idNiveau ? 'selected' : ''}>Aucun emplacement</option>
                            ${niveauOptions}
                        </select>
                    </div>
                    <div class="col-md-4 text-end">
                        <button type="submit" class="btn btn-primary" ${availableNiveaux.length === 0 ? 'disabled' : ''}>Déplacer le set</button>
                    </div>
                </form>
                ${availableNiveaux.length === 0 ? '<p class="text-muted mt-3 mb-0">Vous n’avez aucun niveau disponible pour déplacer ce set.</p>' : ''}
            </div>
        </div>
        <div class="card mt-4 border-danger">
            <div class="card-body">
                <h2 class="h6 mb-3 text-danger">Zone dangereuse</h2>
                <p class="small text-muted mb-3">Supprimer ce set de manière permanente.</p>
                <button type="button" class="btn btn-outline-danger" id="deleteSetBtn" data-set-id="${escapeHtml(set.idObjet || '')}" ${String(set.statut || '').toLowerCase().includes('emprunt') ? 'disabled' : ''}>Supprimer le set</button>
                ${String(set.statut || '').toLowerCase().includes('emprunt') ? '<p class="small text-muted mt-2 mb-0">Impossible de supprimer un set emprunté.</p>' : ''}
            </div>
        </div>    ` : '';

    document.title = `${set.nom || 'Détail du set'} - Lego'llection`;

    content.innerHTML = `
        <div class="card detail-card">
            <div class="card-body p-4 p-lg-5">
                <div class="row g-4 align-items-start">
                    <div class="col-lg-5">
                        ${renderSetImage(set)}
                    </div>
                    <div class="col-lg-7">
                        <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
                            <div>
                                <h1 class="h2 mb-1">${escapeHtml(set.nom || 'Set sans nom')}</h1>
                                <!--<p class="text-muted mb-0">ID : ${escapeHtml(set.idObjet || 'N/A')}</p> -->
                            </div>
                            <span class="badge ${getStatusClass(set.statut)}">${escapeHtml(set.statut || 'Inconnu')}</span>
                        </div>

                        ${set.infoPlus
                            ? `<p class="lead">${escapeHtml(set.infoPlus)}</p>`
                            : '<p class="text-muted">Aucune information complémentaire disponible.</p>'}

                        ${moveFormMarkup}
                        ${updateImageMarkup}

                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="border rounded-3 p-3 h-100">
                                    <h2 class="h6">Informations générales</h2>
                                    <ul class="list-unstyled detail-list mb-0 small">
                                        <li class="d-flex align-items-center gap-2">
                                            <strong>Collection :</strong>
                                            <span>${escapeHtml(set.categorie_nom || 'Non renseignée')}</span>
                                            ${set.categorie_photo ? `
                                                <img src="${escapeHtml(resolveImagePath(set.categorie_photo))}"
                                                     alt="Image de la collection ${escapeHtml(set.categorie_nom || '')}"
                                                     class="collection-badge-image rounded">
                                            ` : ''}
                                        </li>
                                        <li><strong>Date d\'ajout :</strong> ${escapeHtml(formatDate(set.date) || 'Non renseignée')}</li>
                                        <li><strong>Propriétaire :</strong> ${escapeHtml(ownerName || 'Non renseigné')}</li>
                                        <li><strong>Emprunteur :</strong> ${escapeHtml(borrowerName || 'Aucun')}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="border rounded-3 p-3 h-100">
                                    <h2 class="h6">Emplacement détaillé</h2>
                                    ${renderStorageHierarchy(set)}
                                </div>
                            </div>

                            <div class="col-12">
                                <div class="border rounded-3 p-3">
                                    <h2 class="h6">Détails complémentaires</h2>
                                    <ul class="list-unstyled detail-list mb-0 small">
                                        <li><strong>Info rangement du set :</strong> ${escapeHtml(set.objet_info_rangement || 'Non renseignée')}</li>
                                        <li><strong>Info niveau :</strong> ${escapeHtml(set.infoNiveau || 'Non renseignée')}</li>
                                        <li><strong>Info rangement :</strong> ${escapeHtml(set.rangement_info || 'Non renseignée')}</li>
                                        <li><strong>Info local :</strong> ${escapeHtml(set.infoLocal || 'Non renseignée')}</li>
                                        <li><strong>Info collection :</strong> ${escapeHtml(set.categorie_info_plus || 'Non renseignée')}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSetImage(set) {
    const alt = escapeHtml(set.nom || 'Set Lego');

    if (!set.photo) {
        return '<div class="set-hero-placeholder">Aucune image disponible</div>';
    }

    return `<img src="${escapeHtml(resolveImagePath(set.photo))}" alt="${alt}" class="set-hero-image" onerror="this.outerHTML='&lt;div class=&quot;set-hero-placeholder&quot;&gt;Aucune image disponible&lt;/div&gt;'">`;
}

function renderStorageHierarchy(set) {
    const hierarchy = [];

    // Site
    if (set.site_nom) {
        hierarchy.push({
            type: 'site',
            name: set.site_nom,
            image: set.site_photo,
            address: [set.site_adresse, [set.site_code_postal, set.site_localite].filter(Boolean).join(' ')].filter(Boolean).join(', '),
            info: null
        });
    }

    // Local
    if (set.local_nom) {
        hierarchy.push({
            type: 'local',
            name: set.local_nom,
            image: set.local_photo,
            address: null,
            info: set.infoLocal
        });
    }

    // Rangement
    if (set.rangement_nom) {
        hierarchy.push({
            type: 'rangement',
            name: set.rangement_nom,
            image: set.rangement_photo,
            address: null,
            info: set.rangement_info
        });
    }

    // Niveau
    if (set.niveau_nom) {
        hierarchy.push({
            type: 'niveau',
            name: set.niveau_nom,
            image: set.niveau_photo,
            address: null,
            info: set.infoNiveau
        });
    }

    if (hierarchy.length === 0) {
        return '<p class="text-muted mb-0 small">Aucun emplacement défini</p>';
    }

    return `
        <div class="storage-hierarchy">
            ${hierarchy.map((item, index) => `
                <div class="storage-level ${index < hierarchy.length - 1 ? 'mb-3' : ''}">
                    <div class="d-flex align-items-start gap-3">
                        <div class="storage-image-container">
                            ${item.image
                                ? `<img src="${escapeHtml(resolveImagePath(item.image))}"
                                        alt="${escapeHtml(item.name)}"
                                        class="storage-level-image rounded"
                                        onerror="this.style.display='none'">`
                                : '<div class="storage-level-placeholder rounded d-flex align-items-center justify-content-center text-muted small">📍</div>'
                            }
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span class="badge bg-light text-dark small">${getStorageTypeLabel(item.type)}</span>
                                <strong class="small">${escapeHtml(item.name)}</strong>
                            </div>
                            ${item.address ? `<div class="text-muted small mb-1">${escapeHtml(item.address)}</div>` : ''}
                            ${item.info ? `<div class="text-muted small">${escapeHtml(item.info)}</div>` : ''}
                        </div>
                    </div>
                    ${index < hierarchy.length - 1 ? '<div class="storage-connector mt-2 mb-2"></div>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function getStorageTypeLabel(type) {
    const labels = {
        'site': '🏢 Site',
        'local': '📍 Local',
        'rangement': '🗂️ Rangement',
        'niveau': '🧱 Niveau'
    };
    return labels[type] || type;
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

function getStatusClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('disponible')) {
        return 'bg-success';
    }
    if (normalized.includes('emprunt')) {
        return 'bg-warning text-dark';
    }
    return 'bg-secondary';
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
}

function showMessage(type, html) {
    document.getElementById('messageContainer').innerHTML = `<div class="alert alert-${type}" role="alert">${html}</div>`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }

    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

