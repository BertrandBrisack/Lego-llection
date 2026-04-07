document.addEventListener('DOMContentLoaded', function () {
    if (typeof checkUserPermissions === 'function') {
        checkUserPermissions();
    }

    if (typeof initializeProfileMenu === 'function') {
        initializeProfileMenu();
    }

    loadSetDetails();
});

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
        const response = await fetch(`api/set_details.php?id=${encodeURIComponent(setId)}`, {
            credentials: 'include'
        });
        const data = await response.json();

        loadingIndicator.classList.add('d-none');

        if (!response.ok || !data.success || !data.set) {
            showMessage('danger', escapeHtml(data.error || 'Impossible de charger ce set.'));
            return;
        }

        renderSetDetails(data.set);
    } catch (error) {
        console.error('Erreur lors du chargement du détail du set :', error);
        loadingIndicator.classList.add('d-none');
        content.innerHTML = '';
        showMessage('danger', 'Une erreur est survenue lors du chargement du set.');
    }
}

function renderSetDetails(set) {
    const content = document.getElementById('setDetailContent');
    const ownerName = (set.proprietaire_login || [set.proprietaire_prenom, set.proprietaire_nom].filter(Boolean).join(' ').trim()).trim();
    const borrowerName = (set.emprunteur_login || [set.emprunteur_prenom, set.emprunteur_nom].filter(Boolean).join(' ').trim()).trim();
    const locationPath = [set.site_nom, set.local_nom, set.rangement_nom, set.niveau_nom].filter(Boolean).join(' > ');
    const siteAddress = [
        set.site_adresse,
        [set.site_code_postal, set.site_localite].filter(Boolean).join(' ')
    ].filter(Boolean).join(', ');

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

                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="border rounded-3 p-3 h-100">
                                    <h2 class="h6">Informations générales</h2>
                                    <ul class="list-unstyled detail-list mb-0 small">
                                        <li><strong>Collection :</strong> ${escapeHtml(set.categorie_nom || 'Non renseignée')}</li>
                                        <li><strong>Date d\'ajout :</strong> ${escapeHtml(formatDate(set.date) || 'Non renseignée')}</li>
                                        <li><strong>Propriétaire :</strong> ${escapeHtml(ownerName || 'Non renseigné')}</li>
                                        <li><strong>Emprunteur :</strong> ${escapeHtml(borrowerName || 'Aucun')}</li>
                                    </ul>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="border rounded-3 p-3 h-100">
                                    <h2 class="h6">Emplacement</h2>
                                    <ul class="list-unstyled detail-list mb-0 small">
                                        <li><strong>Chemin :</strong> ${escapeHtml(locationPath || 'Non renseigné')}</li>
                                        <li><strong>Site :</strong> ${escapeHtml(set.site_nom || 'Non renseigné')}</li>
                                        <li><strong>Adresse :</strong> ${escapeHtml(siteAddress || 'Non renseignée')}</li>
                                    </ul>
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

    return `<img src="${escapeHtml(set.photo)}" alt="${alt}" class="set-hero-image" onerror="this.outerHTML='&lt;div class=&quot;set-hero-placeholder&quot;&gt;Aucune image disponible&lt;/div&gt;'">`;
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
