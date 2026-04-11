let currentProfileUser = null;
let editStorageModalInstance = null;
const storageRegistry = new Map();
let ownerSites = [];
let ownerLocals = [];
let ownerRangements = [];

window.addEventListener('DOMContentLoaded', () => {
    if (typeof checkUserPermissions === 'function') {
        checkUserPermissions();
    }

    if (typeof initializeProfileMenu === 'function') {
        initializeProfileMenu();
    }

    const editForm = document.getElementById('editStorageForm');
    if (editForm) {
        editForm.addEventListener('submit', submitStorageUpdate);
        initializePhotoUploadWithIds('photoType', 'editPhotoUrlContainer', 'editPhotoUploadContainer', 'editPhoto', 'editPhotoFile');
    }

    const treeContainer = document.getElementById('storageTreeContainer');
    if (treeContainer) {
        treeContainer.removeEventListener('click', handleTreeActions);
        treeContainer.addEventListener('click', handleTreeActions);
    }

    const propertiesContainer = document.getElementById('userPropertiesSummary');
    if (propertiesContainer) {
        propertiesContainer.removeEventListener('click', handleSetActions);
        propertiesContainer.addEventListener('click', handleSetActions);
    }

    loadProfilePage();
});

async function handleSetActions(event) {
    const deleteBtn = event.target.closest('.js-delete-set');
    if (!deleteBtn) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const setId = deleteBtn.dataset.setId;
    await handleDeleteSetFromProfile(setId);
}

async function handleDeleteSetFromProfile(setId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce set ? Cette action est irréversible.')) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('idObjet', setId);

        const response = await fetch('../backend/api/delete_set.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Impossible de supprimer ce set.');
        }

        if (currentProfileUser?.idUtilisateur) {
            await loadOwnerProperties(currentProfileUser.idUtilisateur);
        }
    } catch (error) {
        console.error('Erreur suppression set:', error);
        alert(`Erreur : ${error.message || 'Impossible de supprimer ce set.'}`);
    }
}

async function loadProfilePage() {
    try {
        const response = await fetch('../backend/api/current_user.php', { credentials: 'include' });
        const data = await response.json();

        if (!data.connected || !data.user) {
            document.getElementById('notConnectedMessage').style.display = 'block';
            return;
        }

        currentProfileUser = data.user;
        document.getElementById('profileContent').style.display = 'block';
        document.getElementById('userNom').textContent = data.user.nomUtilisateur || '';
        document.getElementById('userPrenom').textContent = data.user.prenomUtilisateur || '';
        document.getElementById('userLogin').textContent = data.user.login || '';
        document.getElementById('userRole').textContent = data.user.role || '';

        if (data.user.role === 'owner') {
            await loadOwnerProperties(data.user.idUtilisateur);
        } else {
            renderNonOwnerState();
        }
    } catch (error) {
        console.error('Erreur profil:', error);
        document.getElementById('notConnectedMessage').style.display = 'block';
    }
}

async function loadOwnerProperties(userId) {
    const summary = document.getElementById('userPropertiesSummary');
    const treeContainer = document.getElementById('storageTreeContainer');

    if (summary) {
        summary.innerHTML = '<p class="text-muted mb-0">Chargement de vos sets…</p>';
    }
    if (treeContainer) {
        treeContainer.innerHTML = '<p class="text-muted mb-0">Chargement de l’arborescence…</p>';
    }

    try {
        const response = await fetch(`../backend/api/user_properties.php?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Erreur lors du chargement des données');
        }

        renderOwnerSummary(data);
        renderStorageTree(data.tree || [], data.storageCounts || null);
    } catch (error) {
        console.error('Erreur chargement propriétés:', error);
        if (summary) {
            summary.innerHTML = '<p class="text-danger mb-0">Impossible de charger vos sets.</p>';
        }
        if (treeContainer) {
            treeContainer.innerHTML = '<p class="text-danger mb-0">Impossible de charger l’arborescence.</p>';
        }
    }
}

function renderNonOwnerState() {
    const summary = document.getElementById('userPropertiesSummary');
    const treeContainer = document.getElementById('storageTreeContainer');

    if (summary) {
        summary.innerHTML = '<p class="text-muted mb-0">Seuls les propriétaires (owner) disposent d’une collection personnelle de sets.</p>';
    }

    if (treeContainer) {
        treeContainer.innerHTML = '<p class="text-muted mb-0">L’arborescence de rangement est disponible uniquement pour les owners.</p>';
    }
}

function renderOwnerSummary(data) {
    const summary = document.getElementById('userPropertiesSummary');
    if (!summary) {
        return;
    }

    const properties = Array.isArray(data.properties) ? data.properties : [];
    const count = Number(data.count || 0);

    summary.innerHTML = `
        <p>Vous avez <strong>${count}</strong> set(s) dans votre collection.</p>
        ${properties.length > 0 ? `
            <div class="table-responsive">
                <table class="table table-sm align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Set</th>
                            <th>Catégorie</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${properties.map(set => {
                            const isBorrowed = String(set.statut || '').toLowerCase().includes('emprunt');
                            return `
                            <tr>
                                <td><a href="set.html?id=${encodeURIComponent(set.idObjet)}">${escapeProfileHtml(set.nom || 'Sans nom')}</a></td>
                                <td>${escapeProfileHtml(set.categorie || '—')}</td>
                                <td>${escapeProfileHtml(set.statut || '—')}</td>
                                <td>${formatDisplayDate(set.date)}</td>
                                <td>
                                    <button type="button" class="btn btn-sm btn-outline-danger js-delete-set" data-set-id="${escapeProfileHtml(set.idObjet)}" ${isBorrowed ? 'disabled' : ''}>Supprimer</button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        ` : '<p class="text-muted mb-0">Vous n’avez pas encore ajouté de set.</p>'}
    `;
}

function renderStorageTree(sites, counts) {
    const treeContainer = document.getElementById('storageTreeContainer');
    if (!treeContainer) {
        return;
    }

    storageRegistry.clear();

    if (!Array.isArray(sites) || sites.length === 0) {
        treeContainer.innerHTML = '<p class="text-muted mb-0">Vous n’avez pas encore créé de site de rangement.</p>';
        return;
    }

    const countsMarkup = counts ? `
        <div class="row g-2 mb-3">
            <div class="col-sm-6 col-lg-3"><div class="border rounded p-2 text-center bg-light"><strong>${counts.sites || 0}</strong><br><small>site(s)</small></div></div>
            <div class="col-sm-6 col-lg-3"><div class="border rounded p-2 text-center bg-light"><strong>${counts.locals || 0}</strong><br><small>local(aux)</small></div></div>
            <div class="col-sm-6 col-lg-3"><div class="border rounded p-2 text-center bg-light"><strong>${counts.rangements || 0}</strong><br><small>rangement(s)</small></div></div>
            <div class="col-sm-6 col-lg-3"><div class="border rounded p-2 text-center bg-light"><strong>${counts.niveaux || 0}</strong><br><small>niveau(x)</small></div></div>
        </div>
    ` : '';

    treeContainer.innerHTML = `
        ${countsMarkup}
        <div class="storage-tree-list d-grid gap-3">
            ${sites.map(renderSiteNode).join('')}
        </div>
    `;
}

function renderSiteNode(site) {
    const editKey = registerStorageItem('site', site.idSite, site);
    const photo = site.photo ? renderStorageImage(site.photo) : '';

    return `
        <details class="storage-node border rounded p-3 bg-light" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🏢 Site :</strong> ${escapeProfileHtml(site.nom || 'Sans nom')}</span>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
                    <button type="button" class="btn btn-sm btn-outline-danger js-delete-storage" data-type="site" data-id="${escapeProfileHtml(site.idSite)}">Supprimer</button>
                </div>
            </summary>
            <div class="mt-3 text-muted">
                <div><strong>Adresse :</strong> ${escapeProfileHtml(site.adresse || '—')}</div>
                <div><strong>Code postal / localité :</strong> ${escapeProfileHtml([site.codePostal, site.localite].filter(Boolean).join(' ') || '—')}</div>
                ${photo}
            </div>
            <div class="mt-3 ms-3 d-grid gap-2">
                ${Array.isArray(site.locals) && site.locals.length > 0 ? site.locals.map(renderLocalNode).join('') : '<div class="text-muted fst-italic">Aucun local enregistré.</div>'}
            </div>
        </details>
    `;
}

function renderLocalNode(local) {
    const editKey = registerStorageItem('local', local.idLocal, local);
    const photo = local.photo ? renderStorageImage(local.photo) : '';

    return `
        <details class="storage-node border rounded p-3 bg-white" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>📍 Local :</strong> ${escapeProfileHtml(local.nom || 'Sans nom')}</span>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
                    <button type="button" class="btn btn-sm btn-outline-danger js-delete-storage" data-type="local" data-id="${escapeProfileHtml(local.idLocal)}">Supprimer</button>
                </div>
            </summary>
            <div class="mt-3 text-muted">
                <div><strong>Infos :</strong> ${escapeProfileHtml(local.infoLocal || '—')}</div>
                ${photo}
            </div>
            <div class="mt-3 ms-3 d-grid gap-2">
                ${Array.isArray(local.rangements) && local.rangements.length > 0 ? local.rangements.map(renderRangementNode).join('') : '<div class="text-muted fst-italic">Aucun rangement enregistré.</div>'}
            </div>
        </details>
    `;
}

function renderRangementNode(rangement) {
    const editKey = registerStorageItem('rangement', rangement.idRangement, rangement);
    const photo = rangement.photo ? renderStorageImage(rangement.photo) : '';

    return `
        <details class="storage-node border rounded p-3" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🗂️ Rangement :</strong> ${escapeProfileHtml(rangement.nom || 'Sans nom')}</span>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
                    <button type="button" class="btn btn-sm btn-outline-danger js-delete-storage" data-type="rangement" data-id="${escapeProfileHtml(rangement.idRangement)}">Supprimer</button>
                </div>
            </summary>
            <div class="mt-3 text-muted">
                <div><strong>Infos :</strong> ${escapeProfileHtml(rangement.infoRangement || '—')}</div>
                ${photo}
            </div>
            <div class="mt-3 ms-3 d-grid gap-2">
                ${Array.isArray(rangement.niveaux) && rangement.niveaux.length > 0 ? rangement.niveaux.map(renderNiveauNode).join('') : '<div class="text-muted fst-italic">Aucun niveau enregistré.</div>'}
            </div>
        </details>
    `;
}

function renderNiveauNode(niveau) {
    const editKey = registerStorageItem('niveau', niveau.idNiveau, niveau);
    const photo = niveau.photo ? renderStorageImage(niveau.photo) : '';

    return `
        <div class="storage-node border rounded p-3 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🧱 Niveau :</strong> ${escapeProfileHtml(niveau.nom || 'Sans nom')}</span>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
                    <button type="button" class="btn btn-sm btn-outline-danger js-delete-storage" data-type="niveau" data-id="${escapeProfileHtml(niveau.idNiveau)}">Supprimer</button>
                </div>
            </div>
            <div class="mt-3 text-muted">
                <div><strong>Infos :</strong> ${escapeProfileHtml(niveau.infoNiveau || '—')}</div>
                ${photo}
            </div>
        </div>
    `;
}

async function handleTreeActions(event) {
    const editButton = event.target.closest('.js-edit-storage');
    if (editButton) {
        event.preventDefault();
        event.stopPropagation();

        const editKey = editButton.dataset.editKey;
        const item = storageRegistry.get(editKey);
        if (!item) {
            return;
        }

        await openEditModal(item.type, item.data);
        return;
    }

    const deleteButton = event.target.closest('.js-delete-storage');
    if (deleteButton) {
        event.preventDefault();
        event.stopPropagation();

        const type = deleteButton.dataset.type;
        const id = deleteButton.dataset.id;
        await handleDeleteStorage(type, id);
        return;
    }
}

async function handleDeleteStorage(type, id) {
    const typeLabel = {
        'site': 'ce site',
        'local': 'ce local',
        'rangement': 'ce rangement',
        'niveau': 'ce niveau'
    }[type] || 'cet élément';

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer ${typeLabel} ? Tous les éléments qu'il contient seront également supprimés. Cette action est irréversible.`;
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('id', id);

        const response = await fetch('../backend/api/delete_storage.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Impossible de supprimer cet élément.');
        }

        // Succès - recharger les propriétés
        if (currentProfileUser?.idUtilisateur) {
            await loadOwnerProperties(currentProfileUser.idUtilisateur);
        }
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert(`Erreur : ${error.message || 'Impossible de supprimer cet élément.'}`);
    }
}

function registerStorageItem(type, id, data) {
    const key = `${type}:${id}`;
    storageRegistry.set(key, { type, data });
    return key;
}

async function openEditModal(type, data) {
    const modalElement = document.getElementById('editStorageModal');
    if (!modalElement) {
        return;
    }

    document.getElementById('editItemType').value = type;
    document.getElementById('editItemId').value = getStorageId(type, data);
    document.getElementById('editNom').value = data.nom || '';
    document.getElementById('editPhoto').value = data.photo || '';
    resetPhotoFieldsWithIds('photoType', 'editPhotoUrlContainer', 'editPhotoUploadContainer', 'editPhoto', 'editPhotoFile');
    document.getElementById('editAdresse').value = data.adresse || '';
    document.getElementById('editCodePostal').value = data.codePostal || '';
    document.getElementById('editLocalite').value = data.localite || '';
    document.getElementById('editInfoLocal').value = data.infoLocal || '';
    document.getElementById('editInfoRangement').value = data.infoRangement || '';
    document.getElementById('editInfoNiveau').value = data.infoNiveau || '';
    document.getElementById('editStorageModalLabel').textContent = `Modifier ${capitalizeStorageType(type)}`;
    document.getElementById('editStorageFeedback').innerHTML = '';

    document.querySelectorAll('[data-storage-group], [data-parent-group]').forEach(group => {
        const isStorageGroup = group.dataset.storageGroup === type;
        const isParentGroup = group.dataset.parentGroup === type;
        group.style.display = (isStorageGroup || isParentGroup) ? 'block' : 'none';
    });

    await populateParentSelects(type, data);

    if (!editStorageModalInstance) {
        editStorageModalInstance = new bootstrap.Modal(modalElement);
    }

    editStorageModalInstance.show();
}

async function submitStorageUpdate(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const feedback = document.getElementById('editStorageFeedback');
    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);

    const selectedPhotoType = form.querySelector('input[name="photoType"]:checked');
    if (selectedPhotoType && selectedPhotoType.value === 'upload') {
        const fileInput = document.getElementById('editPhotoFile');
        if (fileInput && fileInput.files.length > 0) {
            try {
                const uploadFormData = new FormData();
                uploadFormData.append('photo', fileInput.files[0]);

                const uploadResponse = await fetch('../backend/api/upload_image.php', {
                    method: 'POST',
                    body: uploadFormData,
                    credentials: 'include'
                });
                const uploadResult = await uploadResponse.json();

                if (!uploadResult.success) {
                    throw new Error(uploadResult.message || 'Erreur lors de l\'upload de l\'image.');
                }

                formData.set('photo', uploadResult.path);
            } catch (error) {
                if (feedback) {
                    feedback.innerHTML = `<div class="alert alert-danger py-2 mb-3">${escapeProfileHtml(error.message)}</div>`;
                }
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Enregistrer';
                }
                return;
            }
        }
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';
    }

    if (feedback) {
        feedback.innerHTML = '';
    }

    try {
        const response = await fetch('../backend/api/update_storage.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Mise à jour impossible');
        }

        if (feedback) {
            feedback.innerHTML = '<div class="alert alert-success py-2 mb-3">Modifications enregistrées.</div>';
        }

        if (currentProfileUser?.idUtilisateur) {
            await loadOwnerProperties(currentProfileUser.idUtilisateur);
        }

        window.setTimeout(() => {
            if (editStorageModalInstance) {
                editStorageModalInstance.hide();
            }
        }, 500);
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        if (feedback) {
            feedback.innerHTML = `<div class="alert alert-danger py-2 mb-3">${escapeProfileHtml(error.message)}</div>`;
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Enregistrer';
        }
    }
}

function renderStorageImage(photo) {
    const imageUrl = resolveImagePath(photo);
    if (!imageUrl) {
        return '<div class="text-muted"><strong>Photo :</strong> Aucune image disponible</div>';
    }

    return `
        <div class="mb-3">
            <div class="fw-bold mb-1">Photo :</div>
            <img src="${escapeProfileHtml(imageUrl)}" alt="Photo de rangement" class="img-fluid rounded" style="max-height: 200px; width: auto;" onerror="this.parentNode.innerHTML='<div class=\'text-muted\'><strong>Photo :</strong> Aucune image disponible</div>'">
        </div>
    `;
}

function resolveImagePath(path) {
    if (!path) {
        return '';
    }

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

function getStorageId(type, data) {
    switch (type) {
        case 'site':
            return data.idSite || '';
        case 'local':
            return data.idLocal || '';
        case 'rangement':
            return data.idRangement || '';
        case 'niveau':
            return data.idNiveau || '';
        default:
            return '';
    }
}

async function populateParentSelects(type, data) {
    const siteSelect = document.getElementById('editParentSite');
    const localSelect = document.getElementById('editParentLocal');
    const rangementSelect = document.getElementById('editParentRangement');

    if (!siteSelect || !localSelect || !rangementSelect) {
        return;
    }

    siteSelect.required = false;
    localSelect.required = false;
    rangementSelect.required = false;
    siteSelect.disabled = true;
    localSelect.disabled = true;
    rangementSelect.disabled = true;

    siteSelect.innerHTML = '<option value="">Chargement...</option>';
    localSelect.innerHTML = '<option value="">Chargement...</option>';
    rangementSelect.innerHTML = '<option value="">Chargement...</option>';

    if (type === 'local') {
        await ensureParentLists();
        fillSelectOptions(siteSelect, ownerSites, item => item.idSite || '', item => `${item.nom || 'Sans nom'}${item.responsable_nom ? ' (' + item.responsable_nom + ')' : ''}`, data.idSite || '');
        siteSelect.required = true;
        siteSelect.disabled = ownerSites.length === 0;
    } else if (type === 'rangement') {
        await ensureParentLists();
        fillSelectOptions(localSelect, ownerLocals, item => item.idLocal || '', item => `${item.nom || 'Sans nom'} (${item.site_nom || 'Site inconnu'})`, data.idLocal || '');
        localSelect.required = true;
        localSelect.disabled = ownerLocals.length === 0;
    } else if (type === 'niveau') {
        await ensureParentLists();
        fillSelectOptions(rangementSelect, ownerRangements, item => item.idRangement || '', item => `${item.nom || 'Sans nom'} (${item.local_nom || 'Local inconnu'} / ${item.site_nom || 'Site inconnu'})`, data.idRangement || '');
        rangementSelect.required = true;
        rangementSelect.disabled = ownerRangements.length === 0;
    }
}

function fillSelectOptions(select, items, valueFn, labelFn, selectedValue) {
    if (!select) {
        return;
    }

    if (!Array.isArray(items) || items.length === 0) {
        select.innerHTML = '<option value="">Aucune option disponible</option>';
        return;
    }

    select.innerHTML = '<option value="">Sélectionnez...</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = valueFn(item);
        option.textContent = labelFn(item);
        if (String(option.value) === String(selectedValue)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

async function ensureParentLists() {
    if (ownerSites.length > 0 && ownerLocals.length > 0 && ownerRangements.length > 0) {
        return;
    }

    try {
        const [sitesResponse, localsResponse, rangementsResponse] = await Promise.all([
            fetch('../backend/api/sites.php?mine=1', { credentials: 'include' }),
            fetch('../backend/api/locals.php?mine=1', { credentials: 'include' }),
            fetch('../backend/api/rangements.php?mine=1', { credentials: 'include' })
        ]);

        const [sitesData, localsData, rangementsData] = await Promise.all([
            sitesResponse.json(),
            localsResponse.json(),
            rangementsResponse.json()
        ]);

        ownerSites = Array.isArray(sitesData.sites) ? sitesData.sites : [];
        ownerLocals = Array.isArray(localsData.locals) ? localsData.locals : [];
        ownerRangements = Array.isArray(rangementsData.rangements) ? rangementsData.rangements : [];
    } catch (error) {
        console.error('Erreur chargement des listes parentes :', error);
        ownerSites = ownerSites || [];
        ownerLocals = ownerLocals || [];
        ownerRangements = ownerRangements || [];
    }
}

function capitalizeStorageType(type) {
    const labels = {
        site: 'le site',
        local: 'le local',
        rangement: 'le rangement',
        niveau: 'le niveau'
    };

    return labels[type] || type;
}

function formatDisplayDate(value) {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeProfileHtml(value) : date.toLocaleDateString('fr-FR');
}

function escapeProfileHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text ? String(text).replace(/[&<>"']/g, character => map[character]) : '';
}
