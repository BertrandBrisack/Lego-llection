<?php
header('Content-Type: application/json');

include '../config.php';

try {
    // Test de la connexion
    $stmt = $pdo->query("SELECT 1");
    
    // Compter les lignes dans chaque table
    $stmtLego = $pdo->query("SELECT COUNT(*) as count FROM Lego");
    $legoCount = $stmtLego->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmtCat = $pdo->query("SELECT COUNT(*) as count FROM Categorie");
    $catCount = $stmtCat->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmtUtil = $pdo->query("SELECT COUNT(*) as count FROM Utilisateur");
    $utilCount = $stmtUtil->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'success' => true,
        'db_connected' => true,
        'tables' => [
            'Lego' => $legoCount,
            'Categorie' => $catCount,
            'Utilisateur' => $utilCount
        ]
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'db_connected' => false,
        'error' => $e->getMessage()
    ]);
}
?>