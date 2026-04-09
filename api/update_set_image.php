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

if ($_SESSION['user']['role'] !== 'owner') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Seuls les propriétaires peuvent modifier l’image d’un set.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$idObjet = trim($_POST['idObjet'] ?? '');
$photo = trim($_POST['photo'] ?? '');

if ($idObjet === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Identifiant du set manquant.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($photo === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Aucune image fournie.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Fonction pour supprimer un fichier local d'image
function deleteLocalImage($path) {
    if (!$path || preg_match('/^(https?:\/\/|\/)/', $path)) {
        return; // URL externe ou chemin absolu, on ne supprime rien
    }
    $filePath = __DIR__ . '/../' . $path;
    if (file_exists($filePath)) {
        @unlink($filePath);
    }
}

try {
    $stmt = $pdo->prepare('SELECT idOwner, photo FROM Lego WHERE idObjet = ?');
    $stmt->execute([$idObjet]);
    $set = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$set || (string)$set['idOwner'] !== (string)$_SESSION['user']['idUtilisateur']) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez modifier que vos propres sets.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Supprimer l'ancienne image si elle est locale
    if ($set['photo'] && $set['photo'] !== $photo) {
        deleteLocalImage($set['photo']);
    }

    $updateStmt = $pdo->prepare('UPDATE Lego SET photo = ? WHERE idObjet = ?');
    $updateStmt->execute([$photo, $idObjet]);

    echo json_encode([
        'success' => true,
        'message' => 'Image du set mise à jour avec succès.'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('update_set_image.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la mise à jour de l’image du set.'
    ], JSON_UNESCAPED_UNICODE);
}
