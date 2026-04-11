<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '0');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Vous devez être connecté.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SESSION['user']['role'] !== 'owner') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Seuls les owners peuvent supprimer.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$type = trim($_POST['type'] ?? '');
$id = trim($_POST['id'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($type === '' || $id === '') {
    echo json_encode(['success' => false, 'message' => 'Type ou identifiant manquant.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    switch ($type) {
        case 'site':
            $check = $pdo->prepare('SELECT COUNT(*) FROM Site WHERE idSite = ? AND idResponsable = ?');
            $check->execute([$id, $userId]);
            if ((int)$check->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Non propriétaire du site.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $setsCheck = $pdo->prepare(
                'SELECT COUNT(*) FROM Lego l
                 JOIN Niveau n ON l.idNiveau = n.idNiveau
                 JOIN Rangement r ON n.idRangement = r.idRangement
                 JOIN Local lo ON r.idLocal = lo.idLocal
                 WHERE lo.idSite = ?'
            );
            $setsCheck->execute([$id]);
            if ((int)$setsCheck->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Impossible de supprimer ce site, il contient au moins un set.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $localsStmt = $pdo->prepare('SELECT idLocal FROM Local WHERE idSite = ?');
            $localsStmt->execute([$id]);
            $locals = $localsStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($locals as $idLocal) {
                $rangementsStmt = $pdo->prepare('SELECT idRangement FROM Rangement WHERE idLocal = ?');
                $rangementsStmt->execute([$idLocal]);
                $rangements = $rangementsStmt->fetchAll(PDO::FETCH_COLUMN);
                
                foreach ($rangements as $idRangement) {
                    $niveauxStmt = $pdo->prepare('SELECT idNiveau FROM Niveau WHERE idRangement = ?');
                    $niveauxStmt->execute([$idRangement]);
                    $niveaux = $niveauxStmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    foreach ($niveaux as $idNiveau) {
                        $pdo->prepare('DELETE FROM Lego WHERE idNiveau = ?')->execute([$idNiveau]);
                    }
                    $pdo->prepare('DELETE FROM Niveau WHERE idRangement = ?')->execute([$idRangement]);
                }
                $pdo->prepare('DELETE FROM Rangement WHERE idLocal = ?')->execute([$idLocal]);
            }
            
            $pdo->prepare('DELETE FROM Local WHERE idSite = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM Site WHERE idSite = ?')->execute([$id]);
            break;

        case 'local':
            $check = $pdo->prepare('SELECT COUNT(*) FROM Local l JOIN Site s ON l.idSite = s.idSite WHERE l.idLocal = ? AND s.idResponsable = ?');
            $check->execute([$id, $userId]);
            if ((int)$check->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Non propriétaire du local.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $setsCheck = $pdo->prepare(
                'SELECT COUNT(*) FROM Lego l
                 JOIN Niveau n ON l.idNiveau = n.idNiveau
                 JOIN Rangement r ON n.idRangement = r.idRangement
                 WHERE r.idLocal = ?'
            );
            $setsCheck->execute([$id]);
            if ((int)$setsCheck->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Impossible de supprimer ce local, il contient au moins un set.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $rangementsStmt = $pdo->prepare('SELECT idRangement FROM Rangement WHERE idLocal = ?');
            $rangementsStmt->execute([$id]);
            $rangements = $rangementsStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($rangements as $idRangement) {
                $niveauxStmt = $pdo->prepare('SELECT idNiveau FROM Niveau WHERE idRangement = ?');
                $niveauxStmt->execute([$idRangement]);
                $niveaux = $niveauxStmt->fetchAll(PDO::FETCH_COLUMN);
                
                foreach ($niveaux as $idNiveau) {
                    $pdo->prepare('DELETE FROM Lego WHERE idNiveau = ?')->execute([$idNiveau]);
                }
                $pdo->prepare('DELETE FROM Niveau WHERE idRangement = ?')->execute([$idRangement]);
            }
            
            $pdo->prepare('DELETE FROM Rangement WHERE idLocal = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM Local WHERE idLocal = ?')->execute([$id]);
            break;

        case 'rangement':
            $check = $pdo->prepare('SELECT COUNT(*) FROM Rangement r JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE r.idRangement = ? AND s.idResponsable = ?');
            $check->execute([$id, $userId]);
            if ((int)$check->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Non propriétaire du rangement.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $setsCheck = $pdo->prepare(
                'SELECT COUNT(*) FROM Lego l
                 JOIN Niveau n ON l.idNiveau = n.idNiveau
                 WHERE n.idRangement = ?'
            );
            $setsCheck->execute([$id]);
            if ((int)$setsCheck->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Impossible de supprimer ce rangement, il contient au moins un set.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $niveauxStmt = $pdo->prepare('SELECT idNiveau FROM Niveau WHERE idRangement = ?');
            $niveauxStmt->execute([$id]);
            $niveaux = $niveauxStmt->fetchAll(PDO::FETCH_COLUMN);

            foreach ($niveaux as $idNiveau) {
                $pdo->prepare('DELETE FROM Lego WHERE idNiveau = ?')->execute([$idNiveau]);
            }
            
            $pdo->prepare('DELETE FROM Niveau WHERE idRangement = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM Rangement WHERE idRangement = ?')->execute([$id]);
            break;

        case 'niveau':
            $check = $pdo->prepare('SELECT COUNT(*) FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE n.idNiveau = ? AND s.idResponsable = ?');
            $check->execute([$id, $userId]);
            if ((int)$check->fetchColumn() === 0) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Non propriétaire du niveau.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $setsCheck = $pdo->prepare('SELECT COUNT(*) FROM Lego WHERE idNiveau = ?');
            $setsCheck->execute([$id]);
            if ((int)$setsCheck->fetchColumn() > 0) {
                http_response_code(409);
                echo json_encode(['success' => false, 'message' => 'Impossible de supprimer ce niveau, il contient au moins un set.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $pdo->prepare('DELETE FROM Niveau WHERE idNiveau = ?')->execute([$id]);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Type non reconnu.'], JSON_UNESCAPED_UNICODE);
            exit;
    }

    echo json_encode(['success' => true, 'message' => 'Élément supprimé avec succès.'], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    error_log('DELETE ERROR [' . $type . '-' . $id . ']: ' . $e->getMessage() . ' Code: ' . $e->getCode());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur base de données'], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log('EXCEPTION [' . $type . '-' . $id . ']: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur système'], JSON_UNESCAPED_UNICODE);
}
