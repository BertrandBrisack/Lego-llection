/**
 * Configuration centralisée pour les appels API
 * Permet de gérer facilement le chemin d'accès aux endpoints backend
 */
const API_BASE_URL = '../backend/api';

/**
 * Effectue une requête fetch vers l'API backend
 * @param {string} endpoint - Le fichier PHP de l'endpoint (ex: 'login.php')
 * @param {object} options - Options fetch standard
 * @returns {Promise} La réponse de fetch
 */
function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}/${endpoint}`;
    return fetch(url, options);
}

/**
 * Effectue une requête POST JSON vers l'API
 * @param {string} endpoint - Le fichier PHP de l'endpoint
 * @param {object} data - Les données à envoyer
 * @returns {Promise} La réponse JSON
 */
async function postToAPI(endpoint, data) {
    const response = await fetchAPI(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Effectue une requête GET vers l'API
 * @param {string} endpoint - Le fichier PHP de l'endpoint avec paramètres optionnels
 * @returns {Promise} La réponse JSON
 */
async function getFromAPI(endpoint) {
    const response = await fetchAPI(endpoint, {
        credentials: 'include'
    });
    return response.json();
}
