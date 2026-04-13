let allCollections = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadCollections();
    document.getElementById('searchInput').addEventListener('input', filterCollections);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadCollections() {
    try {
        const response = await fetch('backend/api/collections_list.php', { credentials: 'include' });
        const data = await response.json();
        
        if (data.success) {
            allCollections = data.collections || [];
            displayCollections(allCollections);
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('collectionsContainer').innerHTML = '<div class="col-12 alert alert-danger">Erreur lors du chargement.</div>';
    }
}

function filterCollections() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allCollections.filter(col => {
        const name = String(col.nom || '').toLowerCase();
        return name.includes(searchTerm);
    });
    displayCollections(filtered);
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

function displayCollections(collections) {
    const container = document.getElementById('collectionsContainer');
    
    if (collections.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucune catégorie trouvée.</div>';
        return;
    }

    container.innerHTML = collections.map(collection => {
        const photoHtml = collection.photo ? `<img src="${escapeHtml(getImageSrc(collection.photo))}" alt="Photo" class="collection-photo me-3">` : '';
        
        return `
            <div class="col-12">
                <div class="collection-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                ${photoHtml}
                                <div>
                                    <h5>${escapeHtml(collection.nom || '')}</h5>
                                    ${collection.infoPlus ? `<p class="mb-0"><small>${escapeHtml(collection.infoPlus)}</small></p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-danger" onclick="askDelete('${collection.idCategorie}')">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function askDelete(collectionId) {
    currentDeleteId = collectionId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idCategorie', currentDeleteId);

        const response = await fetch('backend/api/delete_collection.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allCollections = allCollections.filter(c => c.idCategorie !== currentDeleteId);
            displayCollections(allCollections);
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
