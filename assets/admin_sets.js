let allSets = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadSets();
    document.getElementById('searchInput').addEventListener('input', filterSets);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadSets() {
    try {
        const response = await fetch('backend/api/sets.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allSets = data.sets || [];
            displaySets(allSets);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('setsContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterSets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allSets.filter(set => {
        const name = String(set.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displaySets(filtered);
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

function displaySets(sets) {
    const container = document.getElementById('setsContainer');
    
    if (sets.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun set trouvé.</div>';
        return;
    }

    container.innerHTML = sets.map(set => {
        const photoHtml = set.photo ? `<img src="${escapeHtml(getImageSrc(set.photo))}" alt="Photo" class="set-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="set-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(set.nom || '')}</h5>
                                    <p class="mb-1"><small><strong>Catégorie:</strong> ${escapeHtml(set.categorie || 'N/A')}</small></p>
                                    <p class="mb-0"><small><strong>Propriétaire:</strong> ${escapeHtml(set.proprietaire_login || 'N/A')}</small></p>
                                    ${set.infoRangement ? `<p class="mb-1"><small><strong>Info rangement:</strong> ${escapeHtml(set.infoRangement)}</small></p>` : ''}
                                    ${set.infoPlus ? `<p class="mb-0"><small>${escapeHtml(set.infoPlus)}</small></p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <a href="set.html?id=${encodeURIComponent(set.idObjet)}" class="btn btn-sm btn-info">
                                <i class="fas fa-eye"></i> Voir
                            </a>
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${set.idObjet}')">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function askDelete(setId) {
    currentDeleteId = setId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idObjet', currentDeleteId);

        const response = await fetch('backend/api/delete_set.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allSets = allSets.filter(s => s.idObjet !== currentDeleteId);
            displaySets(allSets);
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
    const safeText = text == null ? '' : String(text);
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return safeText.replace(/[&<>"']/g, m => map[m]);
}
