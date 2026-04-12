<?php
session_start();
ob_start();

function sendJson(array $payload, int $status = 200) {
    if (ob_get_length()) {
        ob_clean();
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    include '../config.php';
} catch (Throwable $e) {
    sendJson([
        'success' => false,
        'message' => 'Erreur de connexion à la base de données : ' . $e->getMessage()
    ], 500);
}

if (!isset($pdo) || !$pdo instanceof PDO) {
    sendJson([
        'success' => false,
        'message' => 'Impossible d\'établir la connexion à la base de données.'
    ], 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson([
        'success' => false,
        'message' => 'Méthode non autorisée.'
    ], 405);
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    sendJson([
        'success' => false,
        'message' => 'Vous devez être connecté.'
    ], 401);
}

if (($_SESSION['user']['role'] ?? '') !== 'owner') {
    sendJson([
        'success' => false,
        'message' => 'Seuls les owners peuvent modifier l’arborescence de rangement.'
    ], 403);
}

$type = trim($_POST['type'] ?? '');
$id = trim($_POST['id'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($type === '' || $id === '') {
    sendJson([
        'success' => false,
        'message' => 'Type ou identifiant manquant.'
    ]);
}

// Fonction pour supprimer un fichier local d'image
function deleteLocalImage($path) {
    if (!$path || preg_match('/^(https?:\/\/|\/)/', $path)) {
        return; // URL externe ou chemin absolu, on ne supprime rien
    }
    $filePath = __DIR__ . '/../' . $path;
    if (file_exists($filePath)) {
        @unlink($filePath);
    }
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
                sendJson([
                    'success' => false,
                    'message' => 'Tous les champs du site sont obligatoires sauf la photo.'
                ]);
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*), photo FROM Site WHERE idSite = ? AND idResponsable = ? LIMIT 1');
            $ownershipStmt->execute([$id, $userId]);
            $result = $ownershipStmt->fetch(PDO::FETCH_ASSOC);

            if ((int) ($result['COUNT(*)'] ?? 0) === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que vos propres sites.'
                ], 403);
            }

            // Supprimer l'ancienne image si elle est locale
            if ($result['photo'] && $result['photo'] !== $photo) {
                deleteLocalImage($result['photo']);
            }

            $updateStmt = $pdo->prepare('UPDATE Site SET nom = ?, adresse = ?, codePostal = ?, localite = ?, photo = ? WHERE idSite = ?');
            $updateStmt->execute([$nom, $adresse, $codePostal, $localite, $photo, $id]);
            break;

        case 'local':
            $nom = trim($_POST['nom'] ?? '');
            $infoLocal = trim($_POST['infoLocal'] ?? '');
            $photo = trim($_POST['photo'] ?? '');
            $parentSite = trim($_POST['parentSite'] ?? '');

            if ($nom === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Le nom du local est obligatoire.'
                ]);
            }

            if ($parentSite === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Vous devez sélectionner un site parent pour ce local.'
                ]);
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*), l.photo FROM Local l JOIN Site s ON l.idSite = s.idSite WHERE l.idLocal = ? AND s.idResponsable = ? LIMIT 1');
            $ownershipStmt->execute([$id, $userId]);
            $result = $ownershipStmt->fetch(PDO::FETCH_ASSOC);

            if ((int) ($result['COUNT(*)'] ?? 0) === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des locaux liés à vos sites.'
                ], 403);
            }

            $siteOwnershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?');
            $siteOwnershipStmt->execute([$parentSite, $userId]);

            if ((int) $siteOwnershipStmt->fetchColumn() === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez déplacer ce local que vers un site que vous possédez.'
                ], 403);
            }

            // Supprimer l'ancienne image si elle est locale
            if ($result['photo'] && $result['photo'] !== $photo) {
                deleteLocalImage($result['photo']);
            }

            $updateStmt = $pdo->prepare('UPDATE Local SET idSite = ?, nom = ?, infoLocal = ?, photo = ? WHERE idLocal = ?');
            $updateStmt->execute([$parentSite, $nom, $infoLocal, $photo, $id]);
            break;

        case 'rangement':
            $nom = trim($_POST['nom'] ?? '');
            $infoRangement = trim($_POST['infoRangement'] ?? '');
            $photo = trim($_POST['photo'] ?? '');
            $parentLocal = trim($_POST['parentLocal'] ?? '');

            if ($nom === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Le nom du rangement est obligatoire.'
                ]);
            }

            if ($parentLocal === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Vous devez sélectionner un local parent pour ce rangement.'
                ]);
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*), r.photo FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE r.idRangement = ? AND s.idResponsable = ? LIMIT 1');
            $ownershipStmt->execute([$id, $userId]);
            $result = $ownershipStmt->fetch(PDO::FETCH_ASSOC);

            if ((int) ($result['COUNT(*)'] ?? 0) === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des rangements de vos sites.'
                ], 403);
            }

            $localOwnershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Local l JOIN Site s ON l.idSite = s.idSite WHERE l.idLocal = ? AND s.idResponsable = ?');
            $localOwnershipStmt->execute([$parentLocal, $userId]);

            if ((int) $localOwnershipStmt->fetchColumn() === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez déplacer ce rangement que vers un local que vous possédez.'
                ], 403);
            }

            // Supprimer l'ancienne image si elle est locale
            if ($result['photo'] && $result['photo'] !== $photo) {
                deleteLocalImage($result['photo']);
            }

            $updateStmt = $pdo->prepare('UPDATE Rangement SET idLocal = ?, nom = ?, infoRangement = ?, photo = ? WHERE idRangement = ?');
            $updateStmt->execute([$parentLocal, $nom, $infoRangement, $photo, $id]);
            break;

        case 'niveau':
            $nom = trim($_POST['nom'] ?? '');
            $infoNiveau = trim($_POST['infoNiveau'] ?? '');
            $photo = trim($_POST['photo'] ?? '');
            $parentRangement = trim($_POST['parentRangement'] ?? '');

            if ($nom === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Le nom du niveau est obligatoire.'
                ]);
            }

            if ($parentRangement === '') {
                sendJson([
                    'success' => false,
                    'message' => 'Vous devez sélectionner un rangement parent pour ce niveau.'
                ]);
            }

            $ownershipStmt = $pdo->prepare('SELECT COUNT(*), n.photo FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE n.idNiveau = ? AND s.idResponsable = ? LIMIT 1');
            $ownershipStmt->execute([$id, $userId]);
            $result = $ownershipStmt->fetch(PDO::FETCH_ASSOC);

            if ((int) ($result['COUNT(*)'] ?? 0) === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que des niveaux de vos sites.'
                ], 403);
            }

            $rangementOwnershipStmt = $pdo->prepare('SELECT COUNT(*) FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE r.idRangement = ? AND s.idResponsable = ?');
            $rangementOwnershipStmt->execute([$parentRangement, $userId]);

            if ((int) $rangementOwnershipStmt->fetchColumn() === 0) {
                sendJson([
                    'success' => false,
                    'message' => 'Vous ne pouvez déplacer ce niveau que vers un rangement que vous possédez.'
                ], 403);
            }

            // Supprimer l'ancienne image si elle est locale
            if ($result['photo'] && $result['photo'] !== $photo) {
                deleteLocalImage($result['photo']);
            }

            $updateStmt = $pdo->prepare('UPDATE Niveau SET idRangement = ?, nom = ?, infoNiveau = ?, photo = ? WHERE idNiveau = ?');
            $updateStmt->execute([$parentRangement, $nom, $infoNiveau, $photo, $id]);
            break;

        default:
            sendJson([
                'success' => false,
                'message' => 'Type non reconnu.'
            ]);
    }

    sendJson([
        'success' => true,
        'message' => 'Les informations ont été mises à jour avec succès.'
    ]);
} catch (PDOException $e) {
    $errorMsg = $e->getMessage();
    error_log('update_storage.php PDOException: ' . $errorMsg);
    error_log('update_storage.php - Type: ' . $type . ', ID: ' . $id);
    sendJson([
        'success' => false,
        'message' => 'Erreur base de données: ' . $errorMsg
    ], 500);
} catch (Throwable $e) {
    $errorMsg = $e->getMessage();
    error_log('update_storage.php Throwable: ' . $errorMsg);
    error_log('update_storage.php - Type: ' . $type . ', ID: ' . $id);
    error_log($e->getTraceAsString());
    sendJson([
        'success' => false,
        'message' => 'Erreur: ' . $errorMsg
    ], 500);
}
?>
