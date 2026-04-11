<?php
session_start();
header('Content-Type: application/json');

// Inclusion de la configuration DB
include '../config.php';

try {
    $stmt = $pdo->query("SELECT * FROM categorie");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'categories' => $categories]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des données : ' . $e->getMessage()]);
}
?>