<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Configuration
$uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\') . '/uploads/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Télécharge une image depuis une URL et l'enregistre localement
 */
function downloadImageFromUrl($url, $uploadDir, $userId, $maxFileSize, $allowedTypes) {
    // Valider l'URL
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return ['success' => false, 'message' => 'URL invalide.'];
    }

    // Initialiser cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Headers pour éviter les blocages
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language: fr-FR,fr;q=0.9,en;q=0.8',
        'Referer: ' . $url
    ]);

    $imageData = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);

    if (curl_errno($ch)) {
        curl_close($ch);
        return ['success' => false, 'message' => 'Erreur de connexion: ' . curl_error($ch)];
    }

    curl_close($ch);

    // Vérifier le code HTTP
    if ($httpCode !== 200) {
        return ['success' => false, 'message' => 'Impossible de télécharger l\'image (code HTTP: ' . $httpCode . ').'];
    }

    // Vérifier la taille
    if ($contentLength > $maxFileSize) {
        return ['success' => false, 'message' => 'L\'image est trop volumineuse (max 5MB).'];
    }

    // Vérifier le type MIME
    $contentType = $contentType ? trim(explode(';', $contentType, 2)[0]) : '';
    if (!in_array($contentType, $allowedTypes)) {
        return ['success' => false, 'message' => 'Type de fichier non autorisé. Seules les images JPEG, PNG, GIF et WebP sont acceptées.'];
    }

    // Créer le dossier d'upload s'il n'existe pas
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Générer un nom de fichier unique
    $extension = getExtensionFromMimeType($contentType);
    $filename = uniqid($userId . '_url_', true) . '.' . $extension;
    $filepath = $uploadDir . $filename;

    // Sauvegarder l'image
    if (file_put_contents($filepath, $imageData) === false) {
        return ['success' => false, 'message' => 'Erreur lors de la sauvegarde de l\'image.'];
    }

    return [
        'success' => true,
        'path' => '/uploads/' . $filename
    ];
}

/**
 * Détermine l'extension de fichier à partir du type MIME
 */
function getExtensionFromMimeType($mimeType) {
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];

    return $extensions[$mimeType] ?? 'jpg';
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Vous devez être connecté.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = $_SESSION['user']['idUtilisateur'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vérifier si c'est un upload par URL ou par fichier
$url = trim($_POST['url'] ?? '');

if ($url !== '') {
    // Téléchargement depuis une URL
    $result = downloadImageFromUrl($url, $uploadDir, $userId, $maxFileSize, $allowedTypes);
    if ($result['success']) {
        echo json_encode([
            'success' => true,
            'message' => 'Image téléchargée avec succès depuis l\'URL.',
            'path' => $result['path']
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'message' => $result['message']], JSON_UNESCAPED_UNICODE);
    }
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
    // Retourner un chemin accessible depuis la racine du site
    $relativePath = '/uploads/' . $filename;
    echo json_encode([
        'success' => true,
        'message' => 'Image uploadée avec succès.',
        'path' => $relativePath
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la sauvegarde du fichier.'], JSON_UNESCAPED_UNICODE);
}
?>