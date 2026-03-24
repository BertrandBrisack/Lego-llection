<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

try {
    $stmt = $pdo->query("SELECT r.*, l.nom as local_nom, s.nom as site_nom FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal AND r.idSite = l.idSite JOIN Site s ON l.idSite = s.idSite");
    $rangements = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'rangements' => $rangements]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des rangements.']);
}
?>