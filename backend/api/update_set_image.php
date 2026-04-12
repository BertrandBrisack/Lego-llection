<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

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

// Si c'est une URL externe, la télécharger d'abord
if (filter_var($photo, FILTER_VALIDATE_URL)) {
    $uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\') . '/uploads/';
    $maxFileSize = 5 * 1024 * 1024; // 5MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    $result = downloadImageFromUrl($photo, $uploadDir, $_SESSION['user']['idUtilisateur'], $maxFileSize, $allowedTypes);
    if (!$result['success']) {
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $photo = $result['path'];
}

// Si c'est une URL externe, la télécharger d'abord
if (filter_var($photo, FILTER_VALIDATE_URL)) {
    require_once 'upload_image.php'; // Inclure les fonctions de téléchargement

    $uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/\\') . '/uploads/';
    $maxFileSize = 5 * 1024 * 1024; // 5MB
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    $result = downloadImageFromUrl($photo, $uploadDir, $_SESSION['user']['idUtilisateur'], $maxFileSize, $allowedTypes);
    if (!$result['success']) {
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $photo = $result['path'];
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
