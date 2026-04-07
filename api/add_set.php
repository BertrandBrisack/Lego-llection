<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Vérifier que l'utilisateur est connecté
    if (!isset($_SESSION['user']) || !isset($_SESSION['user']['idUtilisateur'])) {
        echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour ajouter un set.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Vérifier que l'utilisateur a le rôle "owner"
    if ($_SESSION['user']['role'] !== 'owner') {
        echo json_encode(['success' => false, 'message' => 'Seuls les propriétaires (owner) peuvent ajouter des sets.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idNiveau = $_POST['idNiveau'] ?? '';
    $idCategorie = $_POST['idCategorie'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $infoRangement = $_POST['infoRangement'] ?? '';
    $photo = $_POST['photo'] ?? '';
    $infoPlus = $_POST['infoPlus'] ?? '';
    $statut = $_POST['statut'] ?? 'disponible';
    
    // Le propriétaire est l'utilisateur connecté
    $idOwner = $_SESSION['user']['idUtilisateur'];
    $idBorrower = null; // idBorrower peut rester null (emprunteur)

    if ($idNiveau && $idCategorie && $nom) {
        $idObjet = uniqid('lego_', true);
        $date = date('Y-m-d H:i:s');

        try {
            $ownershipStmt = $pdo->prepare("SELECT COUNT(*) FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE n.idNiveau = ? AND s.idResponsable = ?");
            $ownershipStmt->execute([$idNiveau, $idOwner]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                echo json_encode(['success' => false, 'message' => 'Vous pouvez uniquement ajouter un set dans un niveau de vos sites.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO Lego (idNiveau, idCategorie, idOwner, idObjet, nom, infoRangement, photo, infoPlus, date, statut, idBorrower) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idNiveau, $idCategorie, $idOwner, $idObjet, $nom, $infoRangement, $photo, $infoPlus, $date, $statut, $idBorrower]);
            echo json_encode(['success' => true, 'message' => 'Set ajouté avec succès.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du set : ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>