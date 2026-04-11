<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if (!isset($_SESSION['user']['idUtilisateur'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Vous devez être connecté.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$currentUserId = $_SESSION['user']['idUtilisateur'];
$userId = $_GET['userId'] ?? $currentUserId;

if ($userId !== $currentUserId) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Accès non autorisé.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM Lego WHERE idOwner = ?");
    $countStmt->execute([$userId]);
    $count = (int) $countStmt->fetchColumn();

    $propertiesStmt = $pdo->prepare("
        SELECT l.idObjet, l.nom, l.date, l.statut, c.nom AS categorie
        FROM Lego l
        LEFT JOIN Categorie c ON l.idCategorie = c.idCategorie
        WHERE l.idOwner = ?
        ORDER BY l.date DESC, l.nom ASC
        LIMIT 10
    ");
    $propertiesStmt->execute([$userId]);
    $properties = $propertiesStmt->fetchAll(PDO::FETCH_ASSOC);

    $treeStmt = $pdo->prepare("
        SELECT
            s.idSite,
            s.nom AS site_nom,
            s.adresse,
            s.codePostal,
            s.localite,
            s.photo AS site_photo,
            l.idLocal,
            l.nom AS local_nom,
            l.infoLocal,
            l.photo AS local_photo,
            r.idRangement,
            r.nom AS rangement_nom,
            r.infoRangement,
            r.photo AS rangement_photo,
            n.idNiveau,
            n.nom AS niveau_nom,
            n.infoNiveau,
            n.photo AS niveau_photo
        FROM Site s
        LEFT JOIN Local l ON l.idSite = s.idSite
        LEFT JOIN Rangement r ON r.idLocal = l.idLocal
        LEFT JOIN Niveau n ON n.idRangement = r.idRangement
        WHERE s.idResponsable = ?
        ORDER BY s.nom, l.nom, r.nom, n.nom
    ");
    $treeStmt->execute([$userId]);
    $rows = $treeStmt->fetchAll(PDO::FETCH_ASSOC);

    $sitesMap = [];
    $counts = [
        'sites' => 0,
        'locals' => 0,
        'rangements' => 0,
        'niveaux' => 0
    ];

    foreach ($rows as $row) {
        $siteId = $row['idSite'];

        if (!isset($sitesMap[$siteId])) {
            $sitesMap[$siteId] = [
                'idSite' => $siteId,
                'nom' => $row['site_nom'],
                'adresse' => $row['adresse'],
                'codePostal' => $row['codePostal'],
                'localite' => $row['localite'],
                'photo' => $row['site_photo'],
                'locals' => []
            ];
            $counts['sites']++;
        }

        if (!empty($row['idLocal'])) {
            $localId = $row['idLocal'];

            if (!isset($sitesMap[$siteId]['locals'][$localId])) {
                $sitesMap[$siteId]['locals'][$localId] = [
                    'idLocal' => $localId,
                    'idSite' => $siteId,
                    'nom' => $row['local_nom'],
                    'infoLocal' => $row['infoLocal'],
                    'photo' => $row['local_photo'],
                    'rangements' => []
                ];
                $counts['locals']++;
            }

            if (!empty($row['idRangement'])) {
                $rangementId = $row['idRangement'];

                if (!isset($sitesMap[$siteId]['locals'][$localId]['rangements'][$rangementId])) {
                    $sitesMap[$siteId]['locals'][$localId]['rangements'][$rangementId] = [
                        'idRangement' => $rangementId,
                        'idLocal' => $localId,
                        'nom' => $row['rangement_nom'],
                        'infoRangement' => $row['infoRangement'],
                        'photo' => $row['rangement_photo'],
                        'niveaux' => []
                    ];
                    $counts['rangements']++;
                }

                if (!empty($row['idNiveau'])) {
                    $niveauId = $row['idNiveau'];

                    if (!isset($sitesMap[$siteId]['locals'][$localId]['rangements'][$rangementId]['niveaux'][$niveauId])) {
                        $sitesMap[$siteId]['locals'][$localId]['rangements'][$rangementId]['niveaux'][$niveauId] = [
                            'idNiveau' => $niveauId,
                            'idRangement' => $rangementId,
                            'nom' => $row['niveau_nom'],
                            'infoNiveau' => $row['infoNiveau'],
                            'photo' => $row['niveau_photo']
                        ];
                        $counts['niveaux']++;
                    }
                }
            }
        }
    }

    foreach ($sitesMap as &$site) {
        foreach ($site['locals'] as &$local) {
            foreach ($local['rangements'] as &$rangement) {
                $rangement['niveaux'] = array_values($rangement['niveaux']);
            }
            unset($rangement);

            $local['rangements'] = array_values($local['rangements']);
        }
        unset($local);

        $site['locals'] = array_values($site['locals']);
    }
    unset($site);

    echo json_encode([
        'success' => true,
        'count' => $count,
        'properties' => $properties,
        'storageCounts' => $counts,
        'tree' => array_values($sitesMap)
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log('user_properties.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de base de données.'
    ], JSON_UNESCAPED_UNICODE);
}
?>
