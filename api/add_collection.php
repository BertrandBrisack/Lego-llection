<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nom = $_POST['nom'] ?? '';
    $infoPlus = $_POST['infoPlus'] ?? '';

    if ($nom) {
        $idCategorie = uniqid('cat_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Categorie (idCategorie, nom, infoPlus) VALUES (?, ?, ?)");
            $stmt->execute([$idCategorie, $nom, $infoPlus]);
            echo json_encode(['success' => true, 'message' => 'Collection ajoutée avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de la collection : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir le nom.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>