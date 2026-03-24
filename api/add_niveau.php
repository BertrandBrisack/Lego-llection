<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $idRangement = $_POST['idRangement'] ?? '';
    $idLocal = $_POST['idLocal'] ?? '';
    $idSite = $_POST['idSite'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $infoNiveau = $_POST['infoNiveau'] ?? '';
    $photo = $_POST['photo'] ?? '';

    if ($idRangement && $idLocal && $idSite && $nom) {
        $idNiveau = uniqid('niveau_', true);
        try {
            $stmt = $pdo->prepare("INSERT INTO Niveau (idRangement, idLocal, idSite, idNiveau, nom, infoNiveau, photo) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idRangement, $idLocal, $idSite, $idNiveau, $nom, $infoNiveau, $photo]);
            echo json_encode(['success' => true, 'message' => 'Niveau ajouté avec succès.']);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du niveau : ' . $e->getMessage()]);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>