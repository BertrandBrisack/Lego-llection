<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

// Check if user is admin
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strtolower(trim($_SESSION['user']['role'] ?? '')) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès refusé.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$idUtilisateur = trim($_POST['idUtilisateur'] ?? '');

if ($idUtilisateur === '') {
    echo json_encode(['success' => false, 'message' => 'Utilisateur manquant.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo->beginTransaction();

    // Récupérer tous les sets de l'utilisateur
    $setsStmt = $pdo->prepare("SELECT idObjet FROM Lego WHERE idOwner = ?");
    $setsStmt->execute([$idUtilisateur]);
    $sets = $setsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Supprimer chaque set (qui supprimera aussi les dépendances via CASCADE)
    $deleteSetStmt = $pdo->prepare("DELETE FROM Lego WHERE idObjet = ?");
    foreach ($sets as $set) {
        $deleteSetStmt->execute([$set['idObjet']]);
    }

    // Récupérer tous les sites de l'utilisateur
    $sitesStmt = $pdo->prepare("SELECT idSite FROM Site WHERE idResponsable = ?");
    $sitesStmt->execute([$idUtilisateur]);
    $sites = $sitesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Supprimer les sites (ce qui supprimera via CASCADE les locaux, rangements, niveaux)
    $deleteSiteStmt = $pdo->prepare("DELETE FROM Site WHERE idSite = ?");
    foreach ($sites as $site) {
        $deleteSiteStmt->execute([$site['idSite']]);
    }

    // Supprimer l'utilisateur
    $deleteUserStmt = $pdo->prepare("DELETE FROM Utilisateur WHERE idUtilisateur = ?");
    $deleteUserStmt->execute([$idUtilisateur]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Utilisateur supprimé avec succès.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression de l\'utilisateur.'], JSON_UNESCAPED_UNICODE);
}
?>
