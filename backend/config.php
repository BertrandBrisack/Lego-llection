<?php
// config.php - Configuration de la base de données

/**
 * Détecte si on est en environnement local (développement)
 */
function isLocalEnvironment() {
    return php_sapi_name() === 'cli' || in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', 'localhost:80', '127.0.0.1:80']);
}

// Détection de l'environnement
$isLocal = isLocalEnvironment();

if ($isLocal) {
    // Configuration pour l'environnement local (WAMP)
    $host = 'localhost';
    $dbname = 'legollection';
    $username = 'root'; // Utilisateur par défaut de WAMP
    $password = ''; // Mot de passe vide par défaut
} else {
    // Configuration pour l'environnement de production
    $host = 'sql100.infinityfree.com';
    $dbname = 'if0_41635513_legollection';
    $username = 'if0_41635513';
    $password = 'PierreMercier';
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    throw new PDOException("Erreur de connexion : " . $e->getMessage(), (int)$e->getCode(), $e);
}
?>