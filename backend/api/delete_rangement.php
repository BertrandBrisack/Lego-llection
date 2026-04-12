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

$idRangement = trim($_POST['idRangement'] ?? '');

if ($idRangement === '') {
    echo json_encode(['success' => false, 'message' => 'Rangement manquant.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Les cascades CASCADE du modèle supprimera les niveaux
    $pdo->prepare("DELETE FROM Rangement WHERE idRangement = ?")->execute([$idRangement]);

    echo json_encode(['success' => true, 'message' => 'Rangement et dépendances supprimés avec succès.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du rangement.'], JSON_UNESCAPED_UNICODE);
}
?>
