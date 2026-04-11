<?php
// config.php - Configuration de la base de données
$host = 'sql100.infinityfree.com';
$dbname = 'if0_41635513_legollection';
$username = 'if0_41635513'; // Remplacez par vos credentials
$password = 'PierreMercier'; // Remplacez par votre mot de passe

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    throw new PDOException("Erreur de connexion : " . $e->getMessage(), (int)$e->getCode(), $e);
}
?>