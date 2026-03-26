# Nom du projet
Lego'llection

## Descritption
Gestionnaire de stockage / rangement

### Changements récents de nommage (2026-03-26)

- `Pro_idUtilisateur` → `idOwner` (propriétaire du set)
- `idUtilisateur` → `idBorrower` (emprunteur du set)

Ces changements améliorent la lisibilité du code et clarifient le rôle de chaque colonne.

⚠️ **IMPORTANT** : La structure de la base de données a été simplifiée pour éliminer les redondances dans les clés étrangères.

### Ancienne structure (avec redondances)
- `Local`: PK(idLocal, idSite), FK(idSite)
- `Rangement`: PK(idRangement, idLocal, idSite), FK(idLocal, idSite)
- `Niveau`: PK(idNiveau, idRangement, idLocal, idSite), FK(idRangement, idLocal, idSite)
- `Lego`: PK énorme avec tous les IDs, FK complexe

### Nouvelle structure (simplifiée)
- `Local`: PK(idLocal), FK(idSite)
- `Rangement`: PK(idRangement), FK(idLocal)
- `Niveau`: PK(idNiveau), FK(idRangement)
- `Lego`: PK(idObjet), FK(idNiveau), idOwner (propriétaire), idBorrower (emprunteur)

### Migration nécessaire
Si vous avez des données existantes, vous devez :
1. **Sauvegarder** vos données
2. **Recréer la base** avec le nouveau schéma `legollection.sql`
3. **Migrer les données** (les IDs uniques doivent être préservés)

### Impact sur le code
- Les requêtes JOIN ont été simplifiées
- Les INSERT/UPDATE utilisent moins de colonnes
- L'intégrité référentielle est maintenue via les FK directes

## Structure du projet
TODO

## Description tables
- voir legollection.sql
- voir legollection_table.png

## Fonctionnalités prévues
### En tant qu'arrivant
- Créer des utilisateurs (user & visiteur)

### En tant que visiteur
#### Read
- Accéder à tous les sites
- Accéder à tous les sites répondants à X caractéristiques
- Accéder à tous les sites contenants un objet personnel

- Accéder à tous les locaux
- Accéder à tous les locaux répondants à X caractéristiques
- Accéder à tous les locaux contenants un objet personnel

- Accéder à tous les rangements
- Accéder à tous les rangements répondants à X caractéristiques
- Accéder à tous les rangements contenants un objet personnel

- Accéder à tous les niveaux
- Accéder à tous les niveaux répondants à X caractéristiques
- Accéder à tous les niveaux contenants un objet personnel

- Accéder à tous les objets
- Accéder à tous les objets personnels
- Accéder à tous les objets répondants à X caractéristiques

- Accéder aux données personnelles d'un user

#### Update
- Modifier les données personnelles

- Modifier un objet (juste l'emprunter)

### En tant qu'user,
#### Create
- Créer un site (adresse de stockage)
- Créer un local dans un site
- Créer un rangement dans un local
- Créer un niveau dans un rangement

- Créer une collection

- Créer un objet et le "ranger"

#### Update
- Modifier un objet

#### Delete
- Supprimer un objet personnel

### En tant qu'admin
#### Update
- Modifier un site
- Modifier un local
- Modifier un rangement
- Modifier un niveau

- Modifier une collection

#### Delete
- Supprimer un site
- Supprimer un local
- Supprimer un rangement
- Supprimer un niveau

- Supprimer une collection