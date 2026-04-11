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

if ($_SESSION['user']['role'] !== 'owner') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Seuls les propriétaires peuvent modifier l’emplacement d’un set.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$idObjet = trim($_POST['idObjet'] ?? '');
$idNiveau = trim($_POST['idNiveau'] ?? '');
$userId = $_SESSION['user']['idUtilisateur'];

if ($idObjet === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Set manquant.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $setStmt = $pdo->prepare('SELECT idOwner FROM Lego WHERE idObjet = ?');
    $setStmt->execute([$idObjet]);
    $set = $setStmt->fetch(PDO::FETCH_ASSOC);

    if (!$set || (string)$set['idOwner'] !== (string)$userId) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Vous ne pouvez modifier que vos propres sets.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($idNiveau === '_none') {
        $idNiveau = null;
    }

    if ($idNiveau !== null && $idNiveau !== '') {
        $niveauxStmt = $pdo->prepare('SELECT COUNT(*) FROM Niveau n JOIN Rangement r ON n.idRangement = r.idRangement JOIN Local l ON r.idLocal = l.idLocal JOIN Site s ON l.idSite = s.idSite WHERE n.idNiveau = ? AND s.idResponsable = ?');
        $niveauxStmt->execute([$idNiveau, $userId]);

        if ((int) $niveauxStmt->fetchColumn() === 0) {
            http_response_code(403);
            echo json_encode([
                'success' => false,
                'message' => 'Vous ne pouvez déplacer ce set que vers un niveau de vos sites.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    } else {
        $idNiveau = null;
    }

    $updateStmt = $pdo->prepare('UPDATE Lego SET idNiveau = ? WHERE idObjet = ?');
    $updateStmt->execute([$idNiveau, $idObjet]);

    echo json_encode([
        'success' => true,
        'message' => 'Emplacement du set mis à jour avec succès.'
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('update_set_location.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la mise à jour de l’emplacement du set.'
    ], JSON_UNESCAPED_UNICODE);
}
?>