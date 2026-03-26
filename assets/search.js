// Charger les options de recherche au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    loadSearchOptions();
    
    // Gérer la soumission du formulaire
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });

    // Gérer la réinitialisation du formulaire
    document.getElementById('searchForm').addEventListener('reset', function() {
        document.getElementById('resultsList').innerHTML = '';
        document.getElementById('resultsCount').innerHTML = '';
    });
});

// Charger les options pour les sélecteurs
async function loadSearchOptions() {
    try {
        // Charger les sites
        const sitesResponse = await fetch('./api/sites.php');
        const sitesData = await sitesResponse.json();
        if (sitesData.success && sitesData.sites) {
            const siteSelect = document.getElementById('siteSelect');
            sitesData.sites.forEach(site => {
                const option = document.createElement('option');
                option.value = site.nom;
                option.textContent = site.nom;
                siteSelect.appendChild(option);
            });
        }

        // Charger les catégories/collections
        const categoriesResponse = await fetch('./api/categories.php');
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.success && categoriesData.categories) {
            const collectionSelect = document.getElementById('collectionSelect');
            categoriesData.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.nom;
                option.textContent = category.nom;
                collectionSelect.appendChild(option);
            });
        }

        // Charger les locaux
        const localsResponse = await fetch('./api/locals.php');
        const localsData = await localsResponse.json();
        if (localsData.success && localsData.locals) {
            const localSelect = document.getElementById('localSelect');
            localsData.locals.forEach(local => {
                const option = document.createElement('option');
                option.value = local.nom;
                option.textContent = local.nom;
                localSelect.appendChild(option);
            });
        }

        // Charger les rangements
        const rangementsResponse = await fetch('./api/rangements.php');
        const rangementsData = await rangementsResponse.json();
        if (rangementsData.success && rangementsData.rangements) {
            const rangementSelect = document.getElementById('rangementSelect');
            rangementsData.rangements.forEach(rangement => {
                const option = document.createElement('option');
                option.value = rangement.nom;
                option.textContent = rangement.nom;
                rangementSelect.appendChild(option);
            });
        }

        // Charger les niveaux
        const niveauxResponse = await fetch('./api/niveaux.php');
        const niveauxData = await niveauxResponse.json();
        if (niveauxData.success && niveauxData.niveaux) {
            const niveauSelect = document.getElementById('niveauSelect');
            niveauxData.niveaux.forEach(niveau => {
                const option = document.createElement('option');
                option.value = niveau.nom;
                option.textContent = niveau.nom;
                niveauSelect.appendChild(option);
            });
        }

        // Charger les statuts
        const statusResponse = await fetch('./api/statuts.php');
        const statusData = await statusResponse.json();
        if (statusData.success && statusData.statuts) {
            const statusSelect = document.getElementById('statusSelect');
            statusData.statuts.forEach(statusObj => {
                const option = document.createElement('option');
                option.value = statusObj.statut;
                option.textContent = statusObj.statut;
                statusSelect.appendChild(option);
            });
        }

    } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
    }
}

// Effectuer la recherche
async function performSearch() {
    const name = document.getElementById('nameSearch').value.trim();
    const site = document.getElementById('siteSelect').value;
    const local = document.getElementById('localSelect').value;
    const rangement = document.getElementById('rangementSelect').value;
    const niveau = document.getElementById('niveauSelect').value;
    const collection = document.getElementById('collectionSelect').value;
    const owner = document.getElementById('ownerSearch').value.trim();
    const status = document.getElementById('statusSelect').value;

    // Afficher le chargement
    document.getElementById('loadingIndicator').classList.remove('d-none');
    document.getElementById('resultsList').innerHTML = '';
    document.getElementById('resultsCount').innerHTML = '';

    try {
        // Construire les paramètres de requête
        const params = new URLSearchParams();
        if (name) params.append('name', name);
        if (site) params.append('site', site);
        if (local) params.append('local', local);
        if (rangement) params.append('rangement', rangement);
        if (niveau) params.append('niveau', niveau);
        if (collection) params.append('collection', collection);
        if (owner) params.append('owner', owner);
        if (status) params.append('status', status);

        // Effectuer la recherche
        const response = await fetch('./api/search_sets.php?' + params.toString());
        const data = await response.json();

        document.getElementById('loadingIndicator').classList.add('d-none');

        if (data.success) {
            displayResults(data);
        } else {
            document.getElementById('resultsList').innerHTML = `
                <div class="alert alert-danger">
                    Erreur lors de la recherche: ${data.error}
                </div>
            `;
        }
    } catch (error) {
        document.getElementById('loadingIndicator').classList.add('d-none');
        console.error('Erreur:', error);
        document.getElementById('resultsList').innerHTML = `
            <div class="alert alert-danger">
                Une erreur est survenue lors de la recherche.
            </div>
        `;
    }
}

// Afficher les résultats
function displayResults(data) {
    const resultsList = document.getElementById('resultsList');
    const resultsCount = document.getElementById('resultsCount');

    // Afficher le nombre de résultats
    resultsCount.innerHTML = `<p class="text-muted"><strong>${data.total}</strong> résultat(s) trouvé(s)</p>`;

    if (data.sets.length === 0) {
        resultsList.innerHTML = `
            <div class="no-results">
                <p>Aucun set trouvé selon vos critères de recherche.</p>
            </div>
        `;
        return;
    }

    // Créer les cartes des sets
    resultsList.innerHTML = data.sets.map(set => {
        // Formater le statut
        let statusBadge = '';
        let statusColor = '';
        if (set.statut) {
            const lowerStatus = set.statut.toLowerCase();
            // Déterminer la couleur en fonction du statut
            if (lowerStatus.includes('disponible') || lowerStatus.includes('available')) {
                statusColor = 'success';
            } else if (lowerStatus.includes('emprunté') || lowerStatus.includes('borrowed')) {
                statusColor = 'danger';
            } else {
                statusColor = 'secondary';
            }
            statusBadge = set.statut;
        }

        return `
        <div class="set-card">
            <div class="set-header">
                ${set.photo ? `<img src="${set.photo}" alt="${set.nom}" class="set-image">` : '<div class="set-image" style="background-color: #e9ecef;"></div>'}
                <div class="set-info">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <h5 class="mb-2">${escapeHtml(set.nom)}</h5>
                        ${statusBadge ? `<span class="badge bg-${statusColor}">${escapeHtml(statusBadge)}</span>` : ''}
                    </div>
                    ${set.infoPlus ? `<p class="mb-2">${escapeHtml(set.infoPlus)}</p>` : ''}
                    <div class="set-details">
                        ${set.site_nom ? `<span class="set-details-item"><strong>Site:</strong> ${escapeHtml(set.site_nom)}</span>` : ''}
                        ${set.local_nom ? `<span class="set-details-item"><strong>Local:</strong> ${escapeHtml(set.local_nom)}</span>` : ''}
                        ${set.rangement_nom ? `<span class="set-details-item"><strong>Rangement:</strong> ${escapeHtml(set.rangement_nom)}</span>` : ''}
                        ${set.niveau_nom ? `<span class="set-details-item"><strong>Niveau:</strong> ${escapeHtml(set.niveau_nom)}</span>` : ''}
                        ${set.collection ? `<span class="set-details-item"><strong>Collection:</strong> ${escapeHtml(set.collection)}</span>` : ''}
                        ${set.date ? `<span class="set-details-item"><strong>Date:</strong> ${escapeHtml(set.date)}</span>` : ''}
                    </div>
                    ${set.proprietaire_prenom || set.proprietaire_nom ? `
                        <p class="mt-2 mb-0" style="font-size: 0.85rem; color: #666;">
                            <strong>Propriétaire:</strong> ${escapeHtml(set.proprietaire_prenom || '')} ${escapeHtml(set.proprietaire_nom || '')}
                        </p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Fonction pour échapper les caractères HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
