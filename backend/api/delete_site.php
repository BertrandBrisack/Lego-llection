<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

// Check if user is admin
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strtolower(trim($_SESSION['user']['role'] ?? '')) !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès refusé.'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$idSite = trim($_POST['idSite'] ?? '');

if ($idSite === '') {
    echo json_encode(['success' => false, 'message' => 'Site manquant.'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo->beginTransaction();

    // Récupérer tous les locaux du site
    $localsStmt = $pdo->prepare("SELECT idLocal FROM Local WHERE idSite = ?");
    $localsStmt->execute([$idSite]);
    $locals = $localsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Récupérer tous les rangements des locaux
    foreach ($locals as $local) {
        $storageStmt = $pdo->prepare("SELECT idRangement FROM Rangement WHERE idLocal = ?");
        $storageStmt->execute([$local['idLocal']]);
        $storages = $storageStmt->fetchAll(PDO::FETCH_ASSOC);

        // Récupérer tous les niveaux des rangements
        foreach ($storages as $storage) {
            $levelsStmt = $pdo->prepare("SELECT idNiveau FROM Niveau WHERE idRangement = ?");
            $levelsStmt->execute([$storage['idRangement']]);
            $levels = $levelsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Supprimer les niveaux (et les sets associés via SET NULL)
            foreach ($levels as $level) {
                $pdo->prepare("DELETE FROM Niveau WHERE idNiveau = ?")->execute([$level['idNiveau']]);
            }

            // Supprimer les rangements
            $pdo->prepare("DELETE FROM Rangement WHERE idRangement = ?")->execute([$storage['idRangement']]);
        }

        // Supprimer les locaux
        $pdo->prepare("DELETE FROM Local WHERE idLocal = ?")->execute([$local['idLocal']]);
    }

    // Supprimer le site
    $pdo->prepare("DELETE FROM Site WHERE idSite = ?")->execute([$idSite]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Site et dépendances supprimés avec succès.'], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la suppression du site.'], JSON_UNESCAPED_UNICODE);
}
?>
