<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

try {
    $stmt = $pdo->query("SELECT n.*, r.nom as rangement_nom, l.nom as local_nom, s.nom as site_nom FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite");
    $niveaux = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'niveaux' => $niveaux]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des niveaux.']);
}
?>