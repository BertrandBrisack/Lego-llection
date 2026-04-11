<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    $mineOnly = isset($_GET['mine']) && $_GET['mine'] === '1';
    $params = [];
    $sql = "SELECT s.*, u.nomUtilisateur AS responsable_nom, u.prenomUtilisateur AS responsable_prenom
            FROM Site s
            LEFT JOIN Utilisateur u ON s.idResponsable = u.idUtilisateur";

    if ($mineOnly) {
        if (!isset($_SESSION['user']['idUtilisateur'])) {
            echo json_encode(['success' => true, 'sites' => []], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $sql .= " WHERE s.idResponsable = ?";
        $params[] = $_SESSION['user']['idUtilisateur'];
    }

    $sql .= " ORDER BY s.nom";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'sites' => $sites], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des sites.'], JSON_UNESCAPED_UNICODE);
}
?>