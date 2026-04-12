let allLocals = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadLocals();
    document.getElementById('searchInput').addEventListener('input', filterLocals);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadLocals() {
    try {
        const response = await fetch('backend/api/locals.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allLocals = data.locals || [];
            displayLocals(allLocals);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('localsContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterLocals() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allLocals.filter(local => {
        const name = String(local.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displayLocals(filtered);
}

function displayLocals(locals) {
    const container = document.getElementById('localsContainer');
    
    if (locals.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun local trouvé.</div>';
        return;
    }

    container.innerHTML = locals.map(local => {
        const photoHtml = local.photo ? `<img src="${escapeHtml(getImageSrc(local.photo))}" alt="Photo" class="local-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="local-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(local.nom)}</h5>
                                    <p class="mb-1"><small><strong>Site:</strong> ${escapeHtml(local.site_nom || 'N/A')}</small></p>
                                    ${local.infoLocal ? `<p class="mb-0"><small>${escapeHtml(local.infoLocal)}</small></p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${local.idLocal}')">
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

function askDelete(localId) {
    currentDeleteId = localId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idLocal', currentDeleteId);

        const response = await fetch('backend/api/delete_local.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allLocals = allLocals.filter(l => l.idLocal !== currentDeleteId);
            displayLocals(allLocals);
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
