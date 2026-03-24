<?php
include 'config.php';

try {
    $pdo->exec("ALTER TABLE Utilisateur MODIFY mdp VARCHAR(255) NOT NULL");
    echo "Colonne mdp modifiée avec succès.";
} catch (PDOException $e) {
    echo "Erreur : " . $e->getMessage();
}
?>