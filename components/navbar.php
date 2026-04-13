<?php
/**
 * Composant Navbar - Barre de navigation réutilisable
 * Affiche le menu de profil pour les utilisateurs connectés
 * ou un lien de connexion pour les utilisateurs non connectés
 * 
 * Usage : Inclure ce fichier dans le HTML après la balise </header>
 * Location : components/navbar.php
 */
?>

<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
        <a class="navbar-brand" href="index.html">Lego'llection</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link" href="index.html">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="search.html">Recherche</a>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="collectionDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Collection
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="collectionDropdown">
                        <li><a class="dropdown-item" id="myCollectionLink" href="collection.html?view=mine">Ma Collection</a></li>
                        <li><a class="dropdown-item" id="myBorrowsLink" href="collection.html?view=borrows">Mes emprunts</a></li>
                    </ul>
                </li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="addDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Ajouter
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="addDropdown">
                        <li><a class="dropdown-item" href="add_site.html">Site</a></li>
                        <li><a class="dropdown-item" href="add_local.html">Local</a></li>
                        <li><a class="dropdown-item" href="add_rangement.html">Rangement</a></li>
                        <li><a class="dropdown-item" href="add_niveau.html">Niveau</a></li>
                        <li><a class="dropdown-item" href="add_set.html">Set</a></li>
                            <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="add_collection.html">Catégorie</a></li>
                    </ul>
                </li>
                <li class="nav-item dropdown" id="adminMenuContainer" style="display:none;">
                    <a class="nav-link dropdown-toggle" href="#" id="adminDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Admin
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="adminDropdown">
                        <li><a class="dropdown-item" href="admin_users.html"><i class="fas fa-users"></i> Utilisateurs</a></li>
                        <li><a class="dropdown-item" href="admin_collections.html"><i class="fas fa-layer-group"></i> Catégories</a></li>
                        <li><a class="dropdown-item" href="admin_sets.html"><i class="fas fa-cube"></i> Sets</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="admin_sites.html"><i class="fas fa-map-marker-alt"></i> Sites</a></li>
                        <li><a class="dropdown-item" href="admin_locals.html"><i class="fas fa-building"></i> Locaux</a></li>
                        <li><a class="dropdown-item" href="admin_rangements.html"><i class="fas fa-boxes"></i> Rangements</a></li>
                        <li><a class="dropdown-item" href="admin_niveaux.html"><i class="fas fa-layer-group"></i> Niveaux</a></li>
                    </ul>
                </li>
            </ul>
            <div class="d-flex ms-auto">
                <div id="profileMenuContainer" class="d-flex align-items-center">
                    <a href="login.html">
                        <img src="./assets/ProfilParDefaut.png" class="rounded-circle" alt="Photo de profil" width="40" height="40">
                    </a>
                </div>
            </div>
        </div>
    </div>
</nav>
