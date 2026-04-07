<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

try {
    $stmt = $pdo->query("SELECT l.*, s.nom as site_nom FROM Local l JOIN Site s ON l.idSite = s.idSite");
    $locals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'locals' => $locals]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des locaux.']);
}
?>