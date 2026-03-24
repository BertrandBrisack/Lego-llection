<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

try {
    $stmt = $pdo->query("SELECT idUtilisateur, nomUtilisateur, prenomUtilisateur FROM Utilisateur");
    $utilisateurs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'utilisateurs' => $utilisateurs]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des utilisateurs.']);
}
?>