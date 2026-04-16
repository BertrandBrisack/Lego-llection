<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

// Fonction de validation du mot de passe
function validatePassword($mdp) {
    $errors = [];
    
    // Vérifier la longueur minimale
    if (strlen($mdp) < 15) {
        $errors[] = 'Le mot de passe doit contenir au moins 15 caractères';
    }
    
    // Vérifier les majuscules
    if (!preg_match('/[A-Z]/', $mdp)) {
        $errors[] = 'Le mot de passe doit contenir au moins une lettre majuscule';
    }
    
    // Vérifier les minuscules
    if (!preg_match('/[a-z]/', $mdp)) {
        $errors[] = 'Le mot de passe doit contenir au moins une lettre minuscule';
    }
    
    // Vérifier les chiffres
    if (!preg_match('/[0-9]/', $mdp)) {
        $errors[] = 'Le mot de passe doit contenir au moins un chiffre';
    }
    
    // Vérifier la ponctuation/caractères spéciaux
    if (!preg_match('/[!@#$%^&*()_+\-=\[\]{};:'",.<>?\\|`~]/', $mdp)) {
        $errors[] = 'Le mot de passe doit contenir au moins un caractère de ponctuation (!@#$%^&*...)';
    }
    
    return $errors;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nom = $_POST['nom'] ?? '';
    $prenom = $_POST['prenom'] ?? '';
    $role = $_POST['role'] ?? '';
    $login = $_POST['login'] ?? '';
    $mdp = $_POST['mdp'] ?? '';

    if ($nom && $prenom && $role && $login && $mdp) {
        // Valider le mot de passe
        $passwordErrors = validatePassword($mdp);
        if (!empty($passwordErrors)) {
            echo json_encode(['success' => false, 'message' => implode(' | ', $passwordErrors)]);
            exit;
        }
        
        try {
            // Vérifier si le login existe déjà
            $checkStmt = $pdo->prepare("SELECT idUtilisateur FROM Utilisateur WHERE login = ?");
            $checkStmt->execute([$login]);
            if ($checkStmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'Ce pseudo est déjà utilisé. Veuillez choisir un autre pseudo.']);
                exit;
            }
            
            $idUtilisateur = uniqid('user_', true);
            $hashedMdp = password_hash($mdp, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO Utilisateur (idUtilisateur, nomUtilisateur, prenomUtilisateur, role, login, mdp) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idUtilisateur, $nom, $prenom, $role, $login, $hashedMdp]);
            echo json_encode(['success' => true, 'message' => 'Compte créé avec succès. <a href="login.html">Se connecter</a>']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de la création du compte : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>