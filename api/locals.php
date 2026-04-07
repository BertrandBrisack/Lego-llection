<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    $mineOnly = isset($_GET['mine']) && $_GET['mine'] === '1';
    $params = [];
    $sql = "SELECT l.*, s.nom AS site_nom
            FROM Local l
            JOIN Site s ON l.idSite = s.idSite";

    if ($mineOnly) {
        if (!isset($_SESSION['user']['idUtilisateur'])) {
            echo json_encode(['success' => true, 'locals' => []], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql .= " WHERE s.idResponsable = ?";
        $params[] = $_SESSION['user']['idUtilisateur'];
    }

    $sql .= " ORDER BY s.nom, l.nom";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $locals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'locals' => $locals], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des locaux.'], JSON_UNESCAPED_UNICODE);
}
?>