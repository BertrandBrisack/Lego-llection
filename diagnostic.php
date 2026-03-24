<?php
header('Content-Type: text/html; charset=utf-8');

// Afficher les erreurs PHP
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Diagnostic Lego'llection</h1>";

echo "<h2>1. Configuration PHP</h2>";
echo "<p>Version PHP: " . phpversion() . "</p>";
echo "<p>Extensions disponibles:</p>";
echo "<ul>";
echo "<li>PDO: " . (extension_loaded('pdo') ? '✓' : '✗') . "</li>";
echo "<li>PDO MySQL: " . (extension_loaded('pdo_mysql') ? '✓' : '✗') . "</li>";
echo "</ul>";

echo "<h2>2. Connexion Base de Données</h2>";
try {
    include 'config.php';
    echo "<p>✓ Connexion à la BD réussie</p>";
    
    // Vérifier les tables
    $tables = ['Lego', 'Categorie', 'Utilisateur', 'Site', 'Local', 'Rangement', 'Niveau'];
    echo "<p>État des tables:</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM $table");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "<li><strong>$table</strong>: " . $result['cnt'] . " lignes</li>";
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>✗ Erreur: " . $e->getMessage() . "</p>";
}

echo "<h2>3. Test API sets.php</h2>";
echo "<p>URL: <code>api/sets.php?page=1</code></p>";
try {
    $url = 'http://localhost/UE_220_Technologie_Internet_3/legollection/api/sets.php?page=1';
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIE, session_name() . '=' . session_id());
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "<p>HTTP Status: <strong>$httpCode</strong></p>";
    echo "<p>Réponse:</p>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
} catch (Exception $e) {
    echo "<p>Erreur curl: " . $e->getMessage() . "</p>";
}
?>
