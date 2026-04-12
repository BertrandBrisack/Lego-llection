let allUsers = [];
let currentDeleteId = null;
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    document.getElementById('searchInput').addEventListener('input', filterUsers);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

async function loadUsers() {
    try {
        const response = await fetch('backend/api/utilisateurs.php', { credentials: 'include' });
        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (parseError) {
            throw new Error('Réponse API invalide : ' + text);
        }

        if (!response.ok) {
            throw new Error(data.message || text || 'Erreur HTTP ' + response.status);
        }

        if (!data.success) {
            throw new Error(data.message || data.error || 'Erreur serveur inconnue.');
        }

        allUsers = data.utilisateurs || [];
        displayUsers(allUsers);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('usersContainer').innerHTML = `<div class="col-12 alert alert-danger">Erreur lors du chargement : ${escapeHtml(error.message)}</div>`;
    }
}

function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allUsers.filter(user => {
        const lastName = String(user.nomUtilisateur || '').toLowerCase();
        const firstName = String(user.prenomUtilisateur || '').toLowerCase();
        const login = String(user.login || '').toLowerCase();
        return lastName.includes(searchTerm) || firstName.includes(searchTerm) || login.includes(searchTerm);
    });
    displayUsers(filtered);
}

function displayUsers(users) {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="col-12 alert alert-info">Aucun utilisateur trouvé.</div>';
        return;
    }

    container.innerHTML = users.map(user => {
        const firstName = escapeHtml(user.prenomUtilisateur || '');
        const lastName = escapeHtml(user.nomUtilisateur || '');
        const login = escapeHtml(user.login || '');
        const role = escapeHtml(user.role || '');

        return `
        <div class="col-12">
            <div class="user-card">
                <div class="row">
                    <div class="col-md-8">
                        <h5>${firstName} ${lastName}</h5>
                        <p class="mb-1"><small><strong>Login:</strong> ${login}</small></p>
                        <p class="mb-0"><small><strong>Rôle:</strong> ${role}</small></p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-sm btn-danger" onclick="askDelete('${user.idUtilisateur}')">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function askDelete(userId) {
    currentDeleteId = userId;
    deleteModal.show();
}

async function confirmDelete() {
    if (!currentDeleteId) return;

    try {
        const formData = new FormData();
        formData.append('idUtilisateur', currentDeleteId);

        const response = await fetch('backend/api/delete_user.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        const data = await response.json();
        
        if (data.success) {
            deleteModal.hide();
            allUsers = allUsers.filter(u => u.idUtilisateur !== currentDeleteId);
            displayUsers(allUsers);
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
