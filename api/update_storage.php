<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Vous devez être connecté.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SESSION['user']['role'] ?? '') !== 'owner') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Seuls les owners peuvent modifier l’arborescence de rangement.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$type = trim($_POST['type'] ?? '');
$id = trim($_POST['id'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($type === '' || $id === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Type ou identifiant manquant.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    switch ($type) {
        case 'site':
            $nom = trim($_POST['nom'] ?? '');
            $adresse = trim($_POST['adresse'] ?? '');
            $codePostal = trim($_POST['codePostal'] ?? '');
            $localite = trim($_POST['localite'] ?? '');
            $photo = trim($_POST['photo'] ?? '');

            if ($nom === '' || $adresse === '' || $codePostal === '' || $localite === '') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Tous les champs du site sont obligatoires sauf la photo.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?');
            $ownershipStmt->execute([$id, $userId]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que vos propres sites.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $updateStmt = $pdo->prepare('UPDATE Site SET nom = ?, adresse = ?, codePostal = ?, localite = ?, photo = ? WHERE idSite = ?');
            $updateStmt->execute([$nom, $adresse, $codePostal, $localite, $photo, $id]);
            break;

        case 'local':
            $nom = trim($_POST['nom'] ?? '');
            $infoLocal = trim($_POST['infoLocal'] ?? '');
            $photo = trim($_POST['photo'] ?? '');

            if ($nom === '') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Le nom du local est obligatoire.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Local l JOIN Site s ON l.idSite = s.idSite WHERE l.idLocal = ? AND s.idResponsable = ?');
            $ownershipStmt->execute([$id, $userId]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des locaux liés à vos sites.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $updateStmt = $pdo->prepare('UPDATE Local SET nom = ?, infoLocal = ?, photo = ? WHERE idLocal = ?');
            $updateStmt->execute([$nom, $infoLocal, $photo, $id]);
            break;

        case 'rangement':
            $nom = trim($_POST['nom'] ?? '');
            $infoRangement = trim($_POST['infoRangement'] ?? '');
            $photo = trim($_POST['photo'] ?? '');

            if ($nom === '') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Le nom du rangement est obligatoire.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE r.idRangement = ? AND s.idResponsable = ?');
            $ownershipStmt->execute([$id, $userId]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des rangements de vos sites.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $updateStmt = $pdo->prepare('UPDATE Rangement SET nom = ?, infoRangement = ?, photo = ? WHERE idRangement = ?');
            $updateStmt->execute([$nom, $infoRangement, $photo, $id]);
            break;

        case 'niveau':
            $nom = trim($_POST['nom'] ?? '');
            $infoNiveau = trim($_POST['infoNiveau'] ?? '');
            $photo = trim($_POST['photo'] ?? '');

            if ($nom === '') {
                echo json_encode([
                    'success' => false,
                    'message' => 'Le nom du niveau est obligatoire.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE n.idNiveau = ? AND s.idResponsable = ?');
            $ownershipStmt->execute([$id, $userId]);

            if ((int) $ownershipStmt->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des niveaux de vos sites.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $updateStmt = $pdo->prepare('UPDATE Niveau SET nom = ?, infoNiveau = ?, photo = ? WHERE idNiveau = ?');
            $updateStmt->execute([$nom, $infoNiveau, $photo, $id]);
            break;

        default:
            echo json_encode([
                'success' => false,
                'message' => 'Type non reconnu.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Les informations ont été mises à jour avec succès.'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('update_storage.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la mise à jour.'
    ], JSON_UNESCAPED_UNICODE);
}
?>
