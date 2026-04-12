<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    $query = "SELECT idCategorie, nom, infoPlus, photo FROM Categorie ORDER BY nom";
    $stmt = $pdo->query($query);
    $collections = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'collections' => $collections], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des collections.'], JSON_UNESCAPED_UNICODE);
}
?>
