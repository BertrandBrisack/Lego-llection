# Élément Admin - Instructions d'initialisation

## Créer le compte administrateur

Pour initialiser le compte administrateur du système, vous pouvez utiliser l'endpoint d'initialisation :

### Via HTTP POST (recommandé)
Envoyez une requête POST à `/backend/api/init_admin.php` avec les paramètres suivants:
- `login`: le nom d'utilisateur de l'admin (ex: "admin")
- `mdp`: le mot de passe de l'admin

**Important:** Ce endpoint ne fonctionne qu'une seule fois, avant que le premier compte admin ne soit créé.

### Exemple avec curl
```bash
curl -X POST http://localhost/legollection/backend/api/init_admin.php \
  -d "login=admin&mdp=votremotdepasse"
```

### Exemple en JavaScript
```javascript
const formData = new FormData();
formData.append('login', 'admin');
formData.append('mdp', 'votremotdepasse');

fetch('backend/api/init_admin.php', {
  method: 'POST',
  body: formData
})
.then(r => r.json())
.then(data => console.log(data));
```

## Accès au panneau d'administration

Une fois le compte admin créé et connexion effectuée, le menu "Admin" apparaîtra dans la barre de navigation avec 7 sous-menus:

1. **Utilisateurs** - Gestion de tous les utilisateurs (owners et users)
   - Voir profil
   - Supprimer (supprime aussi tous ses sets et lieux de rangement)

2. **Collections** - Gestion des catégories de sets
   - Voir détails (nom, infos, photo)
   - Supprimer (avec option pour supprimer tous les sets de la collection)

3. **Sets** - Gestion de tous les sets du système
   - Voir détails
   - Supprimer

4. **Sites** - Gestion des sites de rangement
   - Voir détails (emplacement, responsable)
   - Supprimer (supprime aussi tous les locaux, rangements et niveaux associés - cascade)

5. **Locaux** - Gestion des locaux dans les sites
   - Voir détails (site parent, infos)
   - Supprimer (supprime aussi tous les rangements et niveaux associés - cascade)

6. **Rangements** - Gestion des rangements dans les locaux
   - Voir détails (local parent, infos)
   - Supprimer (supprime aussi tous les niveaux associés - cascade)

7. **Niveaux** - Gestion des niveaux dans les rangements
   - Voir détails (rangement parent, infos)
   - Supprimer

Chaque page de gestion contient:
- Une barre de recherche pour filtrer les éléments
- Une liste affichant les informations principales (nom, photo, détails)
- Boutons d'action (Voir, Supprimer)
- Modals de confirmation avant suppression

## Architecture

### Endpoints API créés
- `backend/api/utilisateurs.php` (GET) - Liste complète des utilisateurs
- `backend/api/delete_user.php` (POST) - Supprimer un utilisateur (cascade)
- `backend/api/collections_list.php` (GET) - Liste complète des collections
- `backend/api/delete_collection.php` (POST) - Supprimer une collection
- `backend/api/delete_site.php` (POST) - Supprimer un site (cascade)
- `backend/api/delete_local.php` (POST) - Supprimer un local (cascade)
- `backend/api/delete_rangement.php` (POST) - Supprimer un rangement (cascade)
- `backend/api/delete_niveau.php` (POST) - Supprimer un niveau
- `backend/api/init_admin.php` (POST) - Initialiser le compte administrateur

### Pages HTML
- `admin_users.html`
- `admin_collections.html`
- `admin_sets.html`
- `admin_sites.html`
- `admin_locals.html`
- `admin_rangements.html`
- `admin_niveaux.html`

### Fichiers JavaScript
- `assets/admin_users.js`
- `assets/admin_collections.js`
- `assets/admin_sets.js`
- `assets/admin_sites.js`
- `assets/admin_locals.js`
- `assets/admin_rangements.js`
- `assets/admin_niveaux.js`

### Modifications existantes
- `components/navbar.php` - Ajout du menu Admin avec 7 sous-menus
- `assets/permissions.js` - Gestion de la visibilité du menu Admin (rôle = 'admin')
- `backend/api/utilisateurs.php` - Retourne plus d'informations (role, login)
