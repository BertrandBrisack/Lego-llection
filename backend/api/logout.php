<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Détruire la session
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Déconnexion réussie'
], JSON_UNESCAPED_UNICODE);
?>
