<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user']['idUtilisateur'])) {
        echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour ajouter un rangement.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'user') {
        echo json_encode(['success' => false, 'message' => 'Seuls les propriétaires peuvent ajouter un rangement.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idLocal = $_POST['idLocal'] ?? '';
    $nom = trim($_POST['nom'] ?? '');
    $infoRangement = trim($_POST['infoRangement'] ?? '');
    $photo = trim($_POST['photo'] ?? '');

    if ($idLocal && $nom !== '') {
        try {
            $ownershipStmt = $pdo->prepare("SELECT COUNT(*) FROM Local l JOIN Site s ON l.idSite = s.idSite WHERE l.idLocal = ? AND s.idResponsable = ?");
            $ownershipStmt->execute([$idLocal, $_SESSION['user']['idUtilisateur']]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                echo json_encode(['success' => false, 'message' => 'Vous pouvez uniquement ajouter un rangement dans un local de vos sites.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $idRangement = uniqid('rangement_', true);
            $stmt = $pdo->prepare("INSERT INTO Rangement (idLocal, idRangement, nom, infoRangement, photo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$idLocal, $idRangement, $nom, $infoRangement, $photo]);

            echo json_encode(['success' => true, 'message' => 'Rangement ajouté avec succès.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du rangement : ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
}
?>