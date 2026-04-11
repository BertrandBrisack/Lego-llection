<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    $mineOnly = isset($_GET['mine']) && $_GET['mine'] === '1';
    $params = [];
    $sql = "SELECT n.*, r.nom AS rangement_nom, l.nom AS local_nom, s.nom AS site_nom
            FROM Niveau n
            JOIN Rangement r ON n.idRangement = r.idRangement
            JOIN Local l ON r.idLocal = l.idLocal
            JOIN Site s ON l.idSite = s.idSite";

    if ($mineOnly) {
        if (!isset($_SESSION['user']['idUtilisateur'])) {
            echo json_encode(['success' => true, 'niveaux' => []], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql .= " WHERE s.idResponsable = ?";
        $params[] = $_SESSION['user']['idUtilisateur'];
    }

    $sql .= " ORDER BY s.nom, l.nom, r.nom, n.nom";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $niveaux = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'niveaux' => $niveaux], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des niveaux.'], JSON_UNESCAPED_UNICODE);
}
?>