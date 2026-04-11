<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Configuration
$uploadDir = '../../frontend/uploads/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Vous devez être connecté.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'Aucun fichier uploadé ou erreur lors de l\'upload.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['photo'];

// Vérifier la taille du fichier
if ($file['size'] > $maxFileSize) {
    echo json_encode(['success' => false, 'message' => 'Le fichier est trop volumineux (max 5MB).'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vérifier le type MIME
if (!in_array($file['type'], $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Type de fichier non autorisé. Seules les images JPEG, PNG, GIF et WebP sont acceptées.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Créer le dossier d'upload s'il n'existe pas
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Générer un nom de fichier unique
$userId = $_SESSION['user']['idUtilisateur'];
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid($userId . '_', true) . '.' . $extension;
$filepath = $uploadDir . $filename;

// Déplacer le fichier uploadé
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Retourner le chemin relatif pour stockage en base (accessible depuis frontend)
    $relativePath = 'uploads/' . $filename;
    echo json_encode([
        'success' => true,
        'message' => 'Image uploadée avec succès.',
        'path' => $relativePath
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la sauvegarde du fichier.'], JSON_UNESCAPED_UNICODE);
}
?>