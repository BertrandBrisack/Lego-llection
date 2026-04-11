<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    // Récupérer les statuts distincts dans la base de données
    $stmt = $pdo->query("SELECT DISTINCT statut FROM Lego WHERE statut IS NOT NULL AND statut != '' ORDER BY statut");
    $statuts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'statuts' => $statuts], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des statuts.']);
}
?>
