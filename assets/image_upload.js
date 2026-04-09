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
        });
    });
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
    document.getElementById(`${photoTypeName.replace('Type', 'Url')}`).checked = true;
    document.getElementById(urlContainerId).style.display = 'block';
    document.getElementById(uploadContainerId).style.display = 'none';
    document.getElementById(urlInputId).required = true;
    document.getElementById(fileInputId).required = false;
}