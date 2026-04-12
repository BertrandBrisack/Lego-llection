<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

try {
    if (!file_exists(__DIR__ . '/../config.php')) {
        throw new Exception('Fichier de configuration introuvable.');
    }

    require_once __DIR__ . '/../config.php';

    $stmt = $pdo->query("SELECT idUtilisateur, nomUtilisateur, prenomUtilisateur, role, login FROM Utilisateur ORDER BY nomUtilisateur, prenomUtilisateur");
    $utilisateurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'utilisateurs' => $utilisateurs], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la récupération des utilisateurs.', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>