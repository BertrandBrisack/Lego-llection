<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

$userId = $_GET['userId'] ?? null;

if (!$userId) {
    echo json_encode([
        'success' => false,
        'message' => 'ID utilisateur manquant'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Compter les propriétés (sets) du propriétaire
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM Lego WHERE idOwner = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $count = $result['total'] ?? 0;

    // Récupérer les propriétés (up to 10)
    $stmt = $pdo->prepare("
        SELECT idObjet, nom, date, statut, categorie 
        FROM Lego 
        WHERE idOwner = ?
        ORDER BY date DESC
        LIMIT 10
    ");
    $stmt->execute([$userId]);
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'count' => $count,
        'properties' => $properties
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("DB Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données'
    ], JSON_UNESCAPED_UNICODE);
}
?>
