<?php
session_start();
ob_start();

function sendJson(array $payload, int $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    include '../config.php';
} catch (Throwable $e) {
    sendJson([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données : ' . $e->getMessage()
    ], 500);
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    sendJson([
        'success' => false,
        'message' => 'Impossible d\'établir la connexion à la base de données.'
    ], 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ], 405);
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    sendJson([
        'success' => false,
        'message' => 'Vous devez être connecté.'
    ], 401);
}

$userId = $_SESSION['user']['idUtilisateur'];

// Vérifier si c'est une demande de conversion en owner
if (isset($_POST['becomeOwner']) && $_POST['becomeOwner'] === '1') {
    // Vérifier que l'utilisateur est actuellement un user
    if ($_SESSION['user']['role'] !== 'user') {
        sendJson([
            'success' => false,
            'message' => 'Seuls les utilisateurs avec le rôle "user" peuvent devenir owner.'
        ]);
    }

    try {
        $updateStmt = $pdo->prepare('UPDATE Utilisateur SET role = ? WHERE idUtilisateur = ?');
        $updateStmt->execute(['owner', $userId]);
        
        // Mettre à jour la session
        $_SESSION['user']['role'] = 'owner';
        
        sendJson([
            'success' => true,
            'message' => 'Vous êtes maintenant Owner.',
            'user' => [
                'role' => 'owner'
            ]
        ]);
    } catch (Exception $e) {
        sendJson([
            'success' => false,
            'message' => 'Erreur lors de la conversion : ' . $e->getMessage()
        ], 500);
    }
}

// Sinon, c'est une mise à jour du profil standard
$nom = trim($_POST['nomUtilisateur'] ?? '');
$prenom = trim($_POST['prenomUtilisateur'] ?? '');
$login = trim($_POST['login'] ?? '');

// Validation
if ($nom === '' || $prenom === '' || $login === '') {
    sendJson([
        'success' => false,
        'message' => 'Tous les champs sont obligatoires.'
    ]);
}

// Vérifier que le login est unique (sauf si c'est le même que l'utilisateur actuel)
if ($login !== $_SESSION['user']['login']) {
    $checkStmt = $pdo->prepare('SELECT COUNT(*) as count FROM Utilisateur WHERE login = ?');
    $checkStmt->execute([$login]);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ((int)($result['count'] ?? 0) > 0) {
        sendJson([
            'success' => false,
            'message' => 'Ce pseudo est déjà utilisé.'
        ]);
    }
}

try {
    $updateStmt = $pdo->prepare('UPDATE Utilisateur SET nomUtilisateur = ?, prenomUtilisateur = ?, login = ? WHERE idUtilisateur = ?');
    $updateStmt->execute([$nom, $prenom, $login, $userId]);
    
    // Mettre à jour la session
    $_SESSION['user']['nomUtilisateur'] = $nom;
    $_SESSION['user']['prenomUtilisateur'] = $prenom;
    $_SESSION['user']['login'] = $login;
    
    sendJson([
        'success' => true,
        'message' => 'Informations mises à jour avec succès.',
        'user' => [
            'nomUtilisateur' => $nom,
            'prenomUtilisateur' => $prenom,
            'login' => $login
        ]
    ]);
} catch (Exception $e) {
    sendJson([
        'success' => false,
        'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()
    ], 500);
}
?>
