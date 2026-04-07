let currentProfileUser = null;
let editStorageModalInstance = null;
const storageRegistry = new Map();

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
    }

    const treeContainer = document.getElementById('storageTreeContainer');
    if (treeContainer) {
        treeContainer.addEventListener('click', handleTreeActions);
    }

    loadProfilePage();
});

async function loadProfilePage() {
    try {
        const response = await fetch('api/current_user.php', { credentials: 'include' });
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
        const response = await fetch(`api/user_properties.php?userId=${encodeURIComponent(userId)}`, { credentials: 'include' });
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
                        </tr>
                    </thead>
                    <tbody>
                        ${properties.map(set => `
                            <tr>
                                <td><a href="set.html?id=${encodeURIComponent(set.idObjet)}">${escapeProfileHtml(set.nom || 'Sans nom')}</a></td>
                                <td>${escapeProfileHtml(set.categorie || '—')}</td>
                                <td>${escapeProfileHtml(set.statut || '—')}</td>
                                <td>${formatDisplayDate(set.date)}</td>
                            </tr>
                        `).join('')}
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
    const photo = site.photo ? `<div><strong>Photo :</strong> <span class="text-break">${escapeProfileHtml(site.photo)}</span></div>` : '';

    return `
        <details class="storage-node border rounded p-3 bg-light" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🏢 Site :</strong> ${escapeProfileHtml(site.nom || 'Sans nom')}</span>
                <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
            </summary>
            <div class="mt-3 small text-muted">
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
    const photo = local.photo ? `<div><strong>Photo :</strong> <span class="text-break">${escapeProfileHtml(local.photo)}</span></div>` : '';

    return `
        <details class="storage-node border rounded p-3 bg-white" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>📍 Local :</strong> ${escapeProfileHtml(local.nom || 'Sans nom')}</span>
                <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
            </summary>
            <div class="mt-3 small text-muted">
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
    const photo = rangement.photo ? `<div><strong>Photo :</strong> <span class="text-break">${escapeProfileHtml(rangement.photo)}</span></div>` : '';

    return `
        <details class="storage-node border rounded p-3" open>
            <summary class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🗂️ Rangement :</strong> ${escapeProfileHtml(rangement.nom || 'Sans nom')}</span>
                <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
            </summary>
            <div class="mt-3 small text-muted">
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
    const photo = niveau.photo ? `<div><strong>Photo :</strong> <span class="text-break">${escapeProfileHtml(niveau.photo)}</span></div>` : '';

    return `
        <div class="storage-node border rounded p-3 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span><strong>🧱 Niveau :</strong> ${escapeProfileHtml(niveau.nom || 'Sans nom')}</span>
                <button type="button" class="btn btn-sm btn-outline-primary js-edit-storage" data-edit-key="${editKey}">Modifier</button>
            </div>
            <div class="mt-3 small text-muted">
                <div><strong>Infos :</strong> ${escapeProfileHtml(niveau.infoNiveau || '—')}</div>
                ${photo}
            </div>
        </div>
    `;
}

function handleTreeActions(event) {
    const editButton = event.target.closest('.js-edit-storage');
    if (!editButton) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const editKey = editButton.dataset.editKey;
    const item = storageRegistry.get(editKey);
    if (!item) {
        return;
    }

    openEditModal(item.type, item.data);
}

function registerStorageItem(type, id, data) {
    const key = `${type}:${id}`;
    storageRegistry.set(key, { type, data });
    return key;
}

function openEditModal(type, data) {
    const modalElement = document.getElementById('editStorageModal');
    if (!modalElement) {
        return;
    }

    document.getElementById('editItemType').value = type;
    document.getElementById('editItemId').value = getStorageId(type, data);
    document.getElementById('editNom').value = data.nom || '';
    document.getElementById('editPhoto').value = data.photo || '';
    document.getElementById('editAdresse').value = data.adresse || '';
    document.getElementById('editCodePostal').value = data.codePostal || '';
    document.getElementById('editLocalite').value = data.localite || '';
    document.getElementById('editInfoLocal').value = data.infoLocal || '';
    document.getElementById('editInfoRangement').value = data.infoRangement || '';
    document.getElementById('editInfoNiveau').value = data.infoNiveau || '';
    document.getElementById('editStorageModalLabel').textContent = `Modifier ${capitalizeStorageType(type)}`;
    document.getElementById('editStorageFeedback').innerHTML = '';

    document.querySelectorAll('[data-storage-group]').forEach(group => {
        group.style.display = group.dataset.storageGroup === type ? 'block' : 'none';
    });

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

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Enregistrement...';
    }

    if (feedback) {
        feedback.innerHTML = '';
    }

    try {
        const response = await fetch('api/update_storage.php', {
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
