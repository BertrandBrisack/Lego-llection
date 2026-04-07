<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Utilisateur non connecté'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = $_SESSION['user']['idUtilisateur'];
$userRole = strtolower(trim((string) ($_SESSION['user']['role'] ?? '')));
$view = $_GET['view'] ?? 'mine';

if (!in_array($view, ['mine', 'borrows'], true)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Vue demandée invalide'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($view === 'mine' && $userRole !== 'owner') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'error' => 'Accès réservé aux owners'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $whereClause = $view === 'mine' ? 'l.idOwner = ?' : 'l.idBorrower = ?';

    $query = "
        SELECT
            l.idObjet,
            l.nom,
            l.infoPlus,
            l.photo,
            l.date,
            l.statut,
            c.nom AS collection,
            owner.login AS proprietaire_login,
            owner.prenomUtilisateur AS proprietaire_prenom,
            owner.nomUtilisateur AS proprietaire_nom,
            borrower.login AS emprunteur_login,
            borrower.prenomUtilisateur AS emprunteur_prenom,
            borrower.nomUtilisateur AS emprunteur_nom,
            n.nom AS niveau_nom,
            r.nom AS rangement_nom,
            lo.nom AS local_nom,
            s.nom AS site_nom
        FROM Lego l
        LEFT JOIN Categorie c ON l.idCategorie = c.idCategorie
        LEFT JOIN Utilisateur owner ON l.idOwner = owner.idUtilisateur
        LEFT JOIN Utilisateur borrower ON l.idBorrower = borrower.idUtilisateur
        LEFT JOIN Niveau n ON l.idNiveau = n.idNiveau
        LEFT JOIN Rangement r ON n.idRangement = r.idRangement
        LEFT JOIN Local lo ON r.idLocal = lo.idLocal
        LEFT JOIN Site s ON lo.idSite = s.idSite
        WHERE {$whereClause}
        ORDER BY l.date DESC, l.nom ASC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute([$userId]);
    $sets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'view' => $view,
        'total' => count($sets),
        'sets' => $sets
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
} catch (PDOException $e) {
    error_log('Database Error in collection_sets.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données'
    ], JSON_UNESCAPED_UNICODE);
}
?>
