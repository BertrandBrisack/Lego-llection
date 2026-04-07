<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user']['idUtilisateur'])) {
        echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour ajouter un niveau.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'user') {
        echo json_encode(['success' => false, 'message' => 'Seuls les propriétaires peuvent ajouter un niveau.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idRangement = $_POST['idRangement'] ?? '';
    $nom = trim($_POST['nom'] ?? '');
    $infoNiveau = trim($_POST['infoNiveau'] ?? '');
    $photo = trim($_POST['photo'] ?? '');

    if ($idRangement && $nom !== '') {
        try {
            $ownershipStmt = $pdo->prepare("SELECT COUNT(*) FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE r.idRangement = ? AND s.idResponsable = ?");
            $ownershipStmt->execute([$idRangement, $_SESSION['user']['idUtilisateur']]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                echo json_encode(['success' => false, 'message' => 'Vous pouvez uniquement ajouter un niveau dans un rangement de vos sites.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $idNiveau = uniqid('niveau_', true);
            $stmt = $pdo->prepare("INSERT INTO Niveau (idRangement, idNiveau, nom, infoNiveau, photo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$idRangement, $idNiveau, $nom, $infoNiveau, $photo]);

            echo json_encode(['success' => true, 'message' => 'Niveau ajouté avec succès.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du niveau : ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
}
?>