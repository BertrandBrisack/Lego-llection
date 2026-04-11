<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $login = $_POST['login'] ?? '';
    $mdp = $_POST['mdp'] ?? '';

    error_log("Login attempt: login=$login, mdp=" . substr($mdp, 0, 10) . "...");

    if ($login && $mdp) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM Utilisateur WHERE login = ?");
            $stmt->execute([$login]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            error_log("User found: " . ($user ? 'yes' : 'no'));
            if ($user) {
                $isValid = false;
                if (password_verify($mdp, $user['mdp'])) {
                    $isValid = true;
                    error_log("Password verified with hash");
                } elseif ($user['mdp'] === $mdp) {
                    $isValid = true;
                    error_log("Password matched plain text");
                    $newHash = password_hash($mdp, PASSWORD_DEFAULT);
                    $updateStmt = $pdo->prepare("UPDATE Utilisateur SET mdp = ? WHERE idUtilisateur = ?");
                    $updateStmt->execute([$newHash, $user['idUtilisateur']]);
                }
                if ($isValid) {
                    $_SESSION['user'] = $user;
                    echo json_encode(['success' => true, 'message' => 'Connexion réussie']);
                    exit;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Mot de passe incorrect.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'Utilisateur non trouvé.']);
            }
        } catch (PDOException $e) {
            error_log("DB Error: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Erreur de base de données : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>