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

$idCategorie = trim($_POST['idCategorie'] ?? '');

if ($idCategorie === '') {
    echo json_encode(['success' => false, 'message' => 'Catégorie manquante.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo->beginTransaction();

    // Supprimer tous les sets associés à cette catégorie
    $pdo->prepare("DELETE FROM Lego WHERE idCategorie = ?")->execute([$idCategorie]);

    // Supprimer la catégorie
    $pdo->prepare("DELETE FROM Categorie WHERE idCategorie = ?")->execute([$idCategorie]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Catégorie supprimée avec succès.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression de la catégorie.'], JSON_UNESCAPED_UNICODE);
}
?>
