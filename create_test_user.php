<?php
include 'config.php';

$login = 'test';
$mdp = password_hash('test', PASSWORD_DEFAULT);
$id = uniqid('user_', true);
$nom = 'Test';
$prenom = 'User';
$role = 'user';

try {
    $stmt = $pdo->prepare("INSERT INTO Utilisateur (idUtilisateur, nomUtilisateur, prenomUtilisateur, role, login, mdp) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$id, $nom, $prenom, $role, $login, $mdp]);
    echo "Utilisateur test créé : login=test, mdp=test";
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}
?>