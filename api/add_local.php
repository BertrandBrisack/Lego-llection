<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user']['idUtilisateur'])) {
        echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour ajouter un local.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'user') {
        echo json_encode(['success' => false, 'message' => 'Seuls les propriétaires peuvent ajouter un local.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idSite = $_POST['idSite'] ?? '';
    $nom = trim($_POST['nom'] ?? '');
    $infoLocal = trim($_POST['infoLocal'] ?? '');
    $photo = trim($_POST['photo'] ?? '');

    if ($idSite && $nom !== '') {
        try {
            $ownershipStmt = $pdo->prepare("SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?");
            $ownershipStmt->execute([$idSite, $_SESSION['user']['idUtilisateur']]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                echo json_encode(['success' => false, 'message' => 'Vous pouvez uniquement ajouter un local dans un site qui vous appartient.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $idLocal = uniqid('local_', true);
            $stmt = $pdo->prepare("INSERT INTO Local (idSite, idLocal, nom, infoLocal, photo) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$idSite, $idLocal, $nom, $infoLocal, $photo]);

            echo json_encode(['success' => true, 'message' => 'Local ajouté avec succès.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du local : ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
}
?>