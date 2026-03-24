<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Retourner les informations de l'utilisateur connecté
if (isset($_SESSION['user'])) {
    echo json_encode([
        'success' => true,
        'connected' => true,
        'user' => [
            'idUtilisateur' => $_SESSION['user']['idUtilisateur'],
            'nomUtilisateur' => $_SESSION['user']['nomUtilisateur'],
            'prenomUtilisateur' => $_SESSION['user']['prenomUtilisateur'],
            'role' => $_SESSION['user']['role'],
            'login' => $_SESSION['user']['login']
        ]
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode([
        'success' => true,
        'connected' => false,
        'user' => null
    ], JSON_UNESCAPED_UNICODE);
}
?>
