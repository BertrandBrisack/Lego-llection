let allRangements = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadRangements();
    document.getElementById('searchInput').addEventListener('input', filterRangements);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadRangements() {
    try {
        const response = await fetch('backend/api/rangements.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allRangements = data.rangements || [];
            displayRangements(allRangements);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('rangementsContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterRangements() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allRangements.filter(rangement => {
        const name = String(rangement.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displayRangements(filtered);
}

function displayRangements(rangements) {
    const container = document.getElementById('rangementsContainer');
    
    if (rangements.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun rangement trouvé.</div>';
        return;
    }

    container.innerHTML = rangements.map(rangement => {
        const photoHtml = rangement.photo ? `<img src="${escapeHtml(getImageSrc(rangement.photo))}" alt="Photo" class="rangement-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="rangement-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(rangement.nom)}</h5>
                                    <p class="mb-1"><small><strong>Local:</strong> ${escapeHtml(rangement.local_nom || 'N/A')}</small></p>
                                    ${rangement.infoRangement ? `<p class="mb-0"><small>${escapeHtml(rangement.infoRangement)}</small></p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${rangement.idRangement}')">
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

function askDelete(rangementId) {
    currentDeleteId = rangementId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idRangement', currentDeleteId);

        const response = await fetch('backend/api/delete_rangement.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allRangements = allRangements.filter(r => r.idRangement !== currentDeleteId);
            displayRangements(allRangements);
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
