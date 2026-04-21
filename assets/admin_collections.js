let allCollections = [];
let currentDeleteId = null;
let currentEditCollection = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
const editModal = new bootstrap.Modal(document.getElementById('editModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadCollections();
    document.getElementById('searchInput').addEventListener('input', filterCollections);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    document.getElementById('submitEditBtn').addEventListener('click', submitEdit);
    
    // Gérer les changements de type de photo
    const photoTypeRadios = document.querySelectorAll('input[name="photoType"]');
    photoTypeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const urlContainer = document.getElementById('editPhotoUrlContainer');
            const uploadContainer = document.getElementById('editPhotoUploadContainer');
            if (e.target.value === 'url') {
                urlContainer.style.display = 'block';
                uploadContainer.style.display = 'none';
            } else {
                urlContainer.style.display = 'none';
                uploadContainer.style.display = 'block';
            }
        });
    });

    // Aperçu d'image pour URL
    document.getElementById('editPhoto').addEventListener('change', (e) => {
        const preview = document.getElementById('editPhotoPreview');
        const img = preview.querySelector('img');
        if (e.target.value) {
            img.src = e.target.value;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
    });
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
                            <button class="btn btn-sm btn-primary me-2" onclick="openEditModal('${collection.idCategorie}')">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
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

function openEditModal(categoryId) {
    const collection = allCollections.find(c => c.idCategorie === categoryId);
    if (!collection) return;

    currentEditCollection = collection;
    
    // Remplir le formulaire
    document.getElementById('editCategoryId').value = collection.idCategorie;
    document.getElementById('editNom').value = collection.nom || '';
    document.getElementById('editDescription').value = collection.infoPlus || '';
    document.getElementById('editPhoto').value = collection.photo || '';
    
    // Réinitialiser le type de photo et l'aperçu
    document.getElementById('editPhotoUrl').checked = true;
    document.getElementById('editPhotoUrlContainer').style.display = 'block';
    document.getElementById('editPhotoUploadContainer').style.display = 'none';
    document.getElementById('editPhotoPreview').style.display = 'none';
    document.getElementById('editPhotoFile').value = '';
    document.getElementById('editFeedback').innerHTML = '';
    
    editModal.show();
}

async function submitEdit() {
    const categoryId = document.getElementById('editCategoryId').value;
    const nom = document.getElementById('editNom').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const photoType = document.querySelector('input[name="photoType"]:checked').value;
    const feedbackDiv = document.getElementById('editFeedback');
    
    if (!nom) {
        feedbackDiv.innerHTML = '<div class="alert alert-danger">Le nom est obligatoire.</div>';
        return;
    }

    try {
        const formData = new FormData();
        formData.append('idCategorie', categoryId);
        formData.append('nom', nom);
        formData.append('infoPlus', description);
        
        if (photoType === 'url') {
            const photoUrl = document.getElementById('editPhoto').value.trim();
            formData.append('photo', photoUrl);
        } else {
            const photoFile = document.getElementById('editPhotoFile').files[0];
            if (photoFile) {
                formData.append('photoFile', photoFile);
            }
        }

        const response = await fetch('backend/api/update_collection.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            // Mettre à jour la collection locale
            const index = allCollections.findIndex(c => c.idCategorie === categoryId);
            if (index >= 0) {
                allCollections[index].nom = nom;
                allCollections[index].infoPlus = description;
                if (data.photo) {
                    allCollections[index].photo = data.photo;
                }
            }
            
            displayCollections(allCollections);
            editModal.hide();
            feedbackDiv.innerHTML = '';
        } else {
            feedbackDiv.innerHTML = `<div class="alert alert-danger">${escapeHtml(data.message || 'Erreur lors de la mise à jour.')}</div>`;
        }
    } catch (error) {
        console.error('Erreur:', error);
        feedbackDiv.innerHTML = '<div class="alert alert-danger">Erreur lors de la mise à jour.</div>';
    }
}
