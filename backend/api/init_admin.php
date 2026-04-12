<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

// Protection: Only allow this if no admin exists yet
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM Utilisateur WHERE role='admin'");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['count'] > 0) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Un compte admin existe déjà.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur base de données.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$login = trim($_POST['login'] ?? '');
$mdp = trim($_POST['mdp'] ?? '');

if (!$login || !$mdp) {
    echo json_encode(['success' => false, 'message' => 'Login et mot de passe sont requis.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $idAdmin = 'admin';
    $hashedMdp = password_hash($mdp, PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("INSERT INTO Utilisateur (idUtilisateur, nomUtilisateur, prenomUtilisateur, role, login, mdp) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$idAdmin, 'Administrateur', 'Système', 'admin', $login, $hashedMdp]);
    
    echo json_encode(['success' => true, 'message' => 'Compte administrateur créé avec succès.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du compte admin.'], JSON_UNESCAPED_UNICODE);
}
?>
