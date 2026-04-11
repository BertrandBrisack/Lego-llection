<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

// Test de la connexion
try {
    $pdo->query("SELECT 1");
    $dbStatus = ['success' => true, 'message' => 'Connexion BD OK'];
} catch (Exception $e) {
    $dbStatus = ['success' => false, 'message' => $e->getMessage()];
}

// Vérifier les contraintes de clé étrangère
$constraints = [];
try {
    $stmt = $pdo->query("
        SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, DELETE_RULE
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = 'Legollection'
        ORDER BY TABLE_NAME
    ");
    $constraints = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $constraints = ['error' => $e->getMessage()];
}

// Test de suppression sur une table test
$testDelete = [];
try {
    $testStmt = $pdo->prepare("SELECT COUNT(*) as count FROM Niveau LIMIT 1");
    $testStmt->execute();
    $testDelete = ['status' => 'OK', 'message' => 'Requête SELECT sur Niveau fonctionne'];
} catch (Exception $e) {
    $testDelete = ['status' => 'ERROR', 'message' => $e->getMessage()];
}

echo json_encode([
    'database_status' => $dbStatus,
    'constraints_on_delete' => $constraints,
    'test_query' => $testDelete,
    'user_session' => isset($_SESSION['user']) ? ['idUtilisateur' => $_SESSION['user']['idUtilisateur'] ?? 'unknown', 'role' => $_SESSION['user']['role'] ?? 'unknown'] : 'Not logged in'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
