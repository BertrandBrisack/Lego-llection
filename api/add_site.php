<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nom = $_POST['nom'] ?? '';
    $adresse = $_POST['adresse'] ?? '';
    $codePostal = $_POST['codePostal'] ?? '';
    $localite = $_POST['localite'] ?? '';
    $photo = $_POST['photo'] ?? '';

    if ($nom && $adresse && $codePostal && $localite) {
        $idSite = uniqid('site_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Site (idSite, nom, adresse, codePostal, localite, photo) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idSite, $nom, $adresse, $codePostal, $localite, $photo]);
            echo json_encode(['success' => true, 'message' => 'Site ajouté avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du site : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>