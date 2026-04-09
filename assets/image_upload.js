// image_upload.js - Gestion de l'upload d'images

/**
 * Initialise la gestion des photos avec les IDs par défaut
 */
function initializePhotoUpload() {
    initializePhotoUploadWithIds('photoType', 'photoUrlContainer', 'photoUploadContainer', 'photo', 'photoFile');
}

/**
 * Initialise la gestion des photos (URL ou upload) pour un formulaire
 * @param {string} photoTypeName - Nom du groupe de radio buttons pour le type de photo
 * @param {string} urlContainerId - ID du conteneur pour l'URL
 * @param {string} uploadContainerId - ID du conteneur pour l'upload
 * @param {string} urlInputId - ID du champ URL
 * @param {string} fileInputId - ID du champ fichier
 */
function initializePhotoUploadWithIds(photoTypeName, urlContainerId, uploadContainerId, urlInputId, fileInputId) {
    // Gestion du changement de type de photo
    document.querySelectorAll(`input[name="${photoTypeName}"]`).forEach(radio => {
        radio.addEventListener('change', function() {
            const isUrl = this.value === 'url';
            document.getElementById(urlContainerId).style.display = isUrl ? 'block' : 'none';
            document.getElementById(uploadContainerId).style.display = isUrl ? 'none' : 'block';
            document.getElementById(urlInputId).required = isUrl;
            document.getElementById(fileInputId).required = !isUrl;
            
            // Masquer l'aperçu quand on change de type
            const preview = document.getElementById(urlInputId + 'Preview');
            if (preview) {
                preview.style.display = 'none';
            }
        });
    });

    // Ajouter un aperçu pour les URLs
    const urlInput = document.getElementById(urlInputId);
    if (urlInput) {
        urlInput.addEventListener('input', function() {
            updateImagePreview(this.value, urlInputId + 'Preview');
        });
        urlInput.addEventListener('blur', function() {
            updateImagePreview(this.value, urlInputId + 'Preview');
        });
    }
}

/**
 * Gère la soumission d'un formulaire avec upload d'image (version simplifiée)
 * @param {HTMLFormElement} form - Le formulaire à soumettre
 * @param {string} apiEndpoint - Endpoint API pour la soumission
 */
function handleFormWithImageUpload(form, apiEndpoint) {
    handleFormWithImageUploadDetailed(form, apiEndpoint, 'photoType', 'photoFile', (data) => {
        const messageDiv = document.getElementById('message');
        messageDiv.className = 'alert alert-success';
        messageDiv.textContent = data.message;
        messageDiv.style.display = 'block';
        form.reset();
        resetPhotoFields();
    }, (message) => {
        const messageDiv = document.getElementById('message');
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
    });
}

/**
 * Gère la soumission d'un formulaire avec upload d'image
 * @param {HTMLFormElement} form - Le formulaire à soumettre
 * @param {string} apiEndpoint - Endpoint API pour la soumission
 * @param {string} photoTypeName - Nom du groupe de radio buttons
 * @param {string} fileInputId - ID du champ fichier
 * @param {Function} onSuccess - Callback en cas de succès
 * @param {Function} onError - Callback en cas d'erreur
 */
async function handleFormWithImageUploadDetailed(form, apiEndpoint, photoTypeName, fileInputId, onSuccess, onError) {
    try {
        const formData = new FormData(form);
        const photoType = document.querySelector(`input[name="${photoTypeName}"]:checked`).value;

        if (photoType === 'upload' && document.getElementById(fileInputId).files.length > 0) {
            // Upload de l'image d'abord
            const uploadFormData = new FormData();
            uploadFormData.append('photo', document.getElementById(fileInputId).files[0]);

            const uploadResponse = await fetch('api/upload_image.php', {
                method: 'POST',
                body: uploadFormData,
                credentials: 'include'
            });

            const uploadResult = await uploadResponse.json();

            if (!uploadResult.success) {
                throw new Error(uploadResult.message);
            }

            // Utiliser le chemin de l'image uploadée
            formData.set('photo', uploadResult.path);
        }

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            onSuccess(data);
        } else {
            onError(data.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        onError(error.message || 'Erreur de connexion.');
    }
}

/**
 * Réinitialise l'affichage des champs photo après soumission réussie
 */
function resetPhotoFields() {
    resetPhotoFieldsWithIds('photoType', 'photoUrlContainer', 'photoUploadContainer', 'photo', 'photoFile');
}

/**
 * Réinitialise l'affichage des champs photo après soumission réussie
 * @param {string} photoTypeName - Nom du groupe de radio buttons
 * @param {string} urlContainerId - ID du conteneur URL
 * @param {string} uploadContainerId - ID du conteneur upload
 * @param {string} urlInputId - ID du champ URL
 * @param {string} fileInputId - ID du champ fichier
 */
function resetPhotoFieldsWithIds(photoTypeName, urlContainerId, uploadContainerId, urlInputId, fileInputId) {
    const radios = document.querySelectorAll(`input[name="${photoTypeName}"]`);
    if (radios.length > 0) {
        const urlRadio = Array.from(radios).find(radio => radio.value === 'url' || radio.id.toLowerCase().includes('url'));
        if (urlRadio) {
            urlRadio.checked = true;
        } else {
            radios[0].checked = true;
        }
    }

    const urlContainer = document.getElementById(urlContainerId);
    const uploadContainer = document.getElementById(uploadContainerId);
    const urlInput = document.getElementById(urlInputId);
    const fileInput = document.getElementById(fileInputId);

    if (urlContainer) {
        urlContainer.style.display = 'block';
    }
    if (uploadContainer) {
        uploadContainer.style.display = 'none';
    }
    if (urlInput) {
        urlInput.required = true;
    }
    if (fileInput) {
        fileInput.required = false;
    }
}

function updateImagePreview(url, previewId) {
    const preview = document.getElementById(previewId);
    if (!preview) return;

    if (!url || !url.trim()) {
        preview.style.display = 'none';
        return;
    }

    const img = preview.querySelector('img');
    if (img) {
        img.src = url.trim();
        img.onerror = function() {
            preview.style.display = 'none';
        };
        img.onload = function() {
            preview.style.display = 'block';
        };
    }
}