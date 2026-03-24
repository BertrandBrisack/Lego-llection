<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $idLocal = $_POST['idLocal'] ?? '';
    $idSite = $_POST['idSite'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $infoRangement = $_POST['infoRangement'] ?? '';
    $photo = $_POST['photo'] ?? '';

    if ($idLocal && $idSite && $nom) {
        $idRangement = uniqid('rangement_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Rangement (idLocal, idSite, idRangement, nom, infoRangement, photo) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idLocal, $idSite, $idRangement, $nom, $infoRangement, $photo]);
            echo json_encode(['success' => true, 'message' => 'Rangement ajouté avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du rangement : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>