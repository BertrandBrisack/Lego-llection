<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

// Vérification des permissions : réservé aux administrateurs
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé. Cette fonctionnalité est réservée aux administrateurs.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nom = $_POST['nom'] ?? '';
    $infoPlus = $_POST['infoPlus'] ?? '';
    $photo = $_POST['photo'] ?? '';

    if ($nom) {
        $idCategorie = uniqid('cat_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Categorie (idCategorie, nom, infoPlus, photo) VALUES (?, ?, ?, ?)");
            $stmt->execute([$idCategorie, $nom, $infoPlus, $photo]);
            echo json_encode(['success' => true, 'message' => 'Catégorie ajoutée avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout de la catégorie : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir le nom.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>