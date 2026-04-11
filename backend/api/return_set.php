<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Méthode non autorisée'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Utilisateur non connecté'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$idObjet = trim($_POST['idObjet'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($idObjet === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ID de l\'objet manquant'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT idObjet, nom, statut, idOwner, idBorrower FROM Lego WHERE idObjet = ?');
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

    if (empty($set['idBorrower']) || $set['idBorrower'] !== $userId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => 'Vous ne pouvez rendre que les sets que vous avez empruntés'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE Lego SET statut = 'disponible', idBorrower = NULL WHERE idObjet = ?");
    $stmt->execute([$idObjet]);

    echo json_encode([
        'success' => true,
        'message' => 'Le set a bien été rendu à son propriétaire'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('Database Error in return_set.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données'
    ], JSON_UNESCAPED_UNICODE);
}
?>