<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nom = $_POST['nom'] ?? '';
    $prenom = $_POST['prenom'] ?? '';
    $role = $_POST['role'] ?? '';
    $login = $_POST['login'] ?? '';
    $mdp = $_POST['mdp'] ?? '';

    if ($nom && $prenom && $role && $login && $mdp) {
        $idUtilisateur = uniqid('user_', true);
        $hashedMdp = password_hash($mdp, PASSWORD_DEFAULT);
        try {
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