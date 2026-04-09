<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if (!isset($_SESSION['user']['idUtilisateur'])) {
    echo json_encode(['error' => 'Not logged in'], JSON_UNESCAPED_UNICODE);
    exit;
}

$userId = $_SESSION['user']['idUtilisateur'];

try {
    // Récupérer les infos de l'utilisateur
    $userStmt = $pdo->prepare('SELECT idUtilisateur, login, role FROM Utilisateur WHERE idUtilisateur = ?');
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    // Récupérer les sites de l'utilisateur
    $sitesStmt = $pdo->prepare('SELECT idSite, nom, idResponsable FROM Site WHERE idResponsable = ?');
    $sitesStmt->execute([$userId]);
    $sites = $sitesStmt->fetchAll(PDO::FETCH_ASSOC);

    // Test la vérification avec (int)
    $testId = $sites[0]['idSite'] ?? null;
    if ($testId) {
        $checkInt = $pdo->prepare('SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?');
        $checkInt->execute([(int)$testId, (int)$userId]);
        $countInt = (int)$checkInt->fetchColumn();

        $checkStr = $pdo->prepare('SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?');
        $checkStr->execute([$testId, $userId]);
        $countStr = (int)$checkStr->fetchColumn();
    }

    echo json_encode([
        'user' => $user,
        'user_id_type' => gettype($userId),
        'sites_count' => count($sites),
        'sites' => $sites,
        'test_site_id' => $testId ?? null,
        'test_with_int_cast' => $countInt ?? null,
        'test_with_string' => $countStr ?? null
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
