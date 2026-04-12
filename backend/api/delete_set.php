<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Vous devez être connecté.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$userRole = strtolower(trim($_SESSION['user']['role'] ?? ''));
$isOwner = $userRole === 'owner';
$isAdmin = $userRole === 'admin';

if (!$isOwner && !$isAdmin) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Seuls les owners et les admins peuvent supprimer des sets.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$idObjet = trim($_POST['idObjet'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($idObjet === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Set manquant.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $setStmt = $pdo->prepare('SELECT idOwner, statut, idBorrower FROM Lego WHERE idObjet = ?');
    $setStmt->execute([$idObjet]);
    $set = $setStmt->fetch(PDO::FETCH_ASSOC);

    if (!$set) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Set introuvable.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!$isAdmin && (string)$set['idOwner'] !== (string)$userId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez supprimer que vos propres sets.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!$isAdmin && (!empty($set['idBorrower']) || strtolower(trim($set['statut'] ?? '')) === 'emprunté')) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez pas supprimer un set qui est emprunté.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $pdo->prepare('DELETE FROM Lego WHERE idObjet = ?')->execute([$idObjet]);

    echo json_encode([
        'success' => true,
        'message' => 'Set supprimé avec succès.'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('delete_set.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la suppression du set.'
    ], JSON_UNESCAPED_UNICODE);
}
?>
