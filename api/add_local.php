<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $idSite = $_POST['idSite'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $infoLocal = $_POST['infoLocal'] ?? '';
    $photo = $_POST['photo'] ?? '';

    if ($idSite && $nom) {
        $idLocal = uniqid('local_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Local (idSite, idLocal, nom, infoLocal, photo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$idSite, $idLocal, $nom, $infoLocal, $photo]);
            echo json_encode(['success' => true, 'message' => 'Local ajouté avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du local : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>