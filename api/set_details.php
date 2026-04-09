<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

$idObjet = trim($_GET['id'] ?? $_GET['idObjet'] ?? '');

if ($idObjet === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ID du set manquant'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $query = "
        SELECT
            l.idObjet,
            l.nom,
            l.infoRangement AS objet_info_rangement,
            l.infoPlus,
            l.photo,
            l.date,
            l.statut,
            l.idOwner,
            l.idBorrower,
            c.idCategorie,
            c.nom AS categorie_nom,
            c.infoPlus AS categorie_info_plus,
            owner.prenomUtilisateur AS proprietaire_prenom,
            owner.nomUtilisateur AS proprietaire_nom,
            owner.login AS proprietaire_login,
            borrower.prenomUtilisateur AS emprunteur_prenom,
            borrower.nomUtilisateur AS emprunteur_nom,
            borrower.login AS emprunteur_login,
            n.idNiveau,
            n.nom AS niveau_nom,
            n.infoNiveau,
            n.photo AS niveau_photo,
            r.idRangement,
            r.nom AS rangement_nom,
            r.infoRangement AS rangement_info,
            r.photo AS rangement_photo,
            lo.idLocal,
            lo.nom AS local_nom,
            lo.infoLocal,
            lo.photo AS local_photo,
            s.idSite,
            s.nom AS site_nom,
            s.adresse AS site_adresse,
            s.codePostal AS site_code_postal,
            s.localite AS site_localite,
            s.photo AS site_photo
        FROM Lego l
        LEFT JOIN Categorie c ON l.idCategorie = c.idCategorie
        LEFT JOIN Utilisateur owner ON l.idOwner = owner.idUtilisateur
        LEFT JOIN Utilisateur borrower ON l.idBorrower = borrower.idUtilisateur
        LEFT JOIN Niveau n ON l.idNiveau = n.idNiveau
        LEFT JOIN Rangement r ON n.idRangement = r.idRangement
        LEFT JOIN Local lo ON r.idLocal = lo.idLocal
        LEFT JOIN Site s ON lo.idSite = s.idSite
        WHERE l.idObjet = ?
        LIMIT 1
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$idObjet]);
    $set = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$set) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Set introuvable'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'success' => true,
        'set' => $set
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('Database Error in set_details.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données'
    ], JSON_UNESCAPED_UNICODE);
}
?>
