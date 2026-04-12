let allSites = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadSites();
    document.getElementById('searchInput').addEventListener('input', filterSites);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadSites() {
    try {
        const response = await fetch('backend/api/sites.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allSites = data.sites || [];
            displaySites(allSites);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('sitesContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterSites() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allSites.filter(site => {
        const name = String(site.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displaySites(filtered);
}

function displaySites(sites) {
    const container = document.getElementById('sitesContainer');
    
    if (sites.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun site trouvé.</div>';
        return;
    }

    container.innerHTML = sites.map(site => {
        const photoHtml = site.photo ? `<img src="${escapeHtml(getImageSrc(site.photo))}" alt="Photo" class="site-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="site-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(site.nom)}</h5>
                                    <p class="mb-1"><small><strong>Adresse:</strong> ${escapeHtml(site.adresse)}, ${escapeHtml(site.codePostal)} ${escapeHtml(site.localite)}</small></p>
                                    <p class="mb-0"><small><strong>Responsable:</strong> ${escapeHtml(site.responsable_prenom || 'N/A')} ${escapeHtml(site.responsable_nom || 'N/A')}</small></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${site.idSite}')">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getImageSrc(photo) {
    if (!photo) {
        return '';
    }

    const safePhoto = String(photo).trim();
    if (safePhoto.startsWith('http://') || safePhoto.startsWith('https://') || safePhoto.startsWith('/')) {
        return safePhoto;
    }

    const uploadsIndex = safePhoto.indexOf('uploads/');
    if (uploadsIndex >= 0) {
        return safePhoto.slice(uploadsIndex);
    }

    return `uploads/${safePhoto.replace(/^\.\/?/, '')}`;
}

function askDelete(siteId) {
    currentDeleteId = siteId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idSite', currentDeleteId);

        const response = await fetch('backend/api/delete_site.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allSites = allSites.filter(s => s.idSite !== currentDeleteId);
            displaySites(allSites);
            currentDeleteId = null;
        } else {
            alert('Erreur: ' + data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression.');
    }
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
