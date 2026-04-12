let allNiveaux = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadNiveaux();
    document.getElementById('searchInput').addEventListener('input', filterNiveaux);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadNiveaux() {
    try {
        const response = await fetch('backend/api/niveaux.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allNiveaux = data.niveaux || [];
            displayNiveaux(allNiveaux);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('niveauxContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterNiveaux() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allNiveaux.filter(niveau => {
        const name = String(niveau.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displayNiveaux(filtered);
}

function displayNiveaux(niveaux) {
    const container = document.getElementById('niveauxContainer');
    
    if (niveaux.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun niveau trouvé.</div>';
        return;
    }

    container.innerHTML = niveaux.map(niveau => {
        const photoHtml = niveau.photo ? `<img src="${escapeHtml(getImageSrc(niveau.photo))}" alt="Photo" class="niveau-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="niveau-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(niveau.nom)}</h5>
                                    <p class="mb-1"><small><strong>Rangement:</strong> ${escapeHtml(niveau.rangement_nom || 'N/A')}</small></p>
                                    ${niveau.infoNiveau ? `<p class="mb-0"><small>${escapeHtml(niveau.infoNiveau)}</small></p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${niveau.idNiveau}')">
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

function askDelete(niveauId) {
    currentDeleteId = niveauId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idNiveau', currentDeleteId);

        const response = await fetch('backend/api/delete_niveau.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allNiveaux = allNiveaux.filter(n => n.idNiveau !== currentDeleteId);
            displayNiveaux(allNiveaux);
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
