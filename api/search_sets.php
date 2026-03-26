<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    // Récupérer les paramètres de recherche
    $name = isset($_GET['name']) ? trim($_GET['name']) : '';
    $site = isset($_GET['site']) ? trim($_GET['site']) : '';
    $local = isset($_GET['local']) ? trim($_GET['local']) : '';
    $rangement = isset($_GET['rangement']) ? trim($_GET['rangement']) : '';
    $niveau = isset($_GET['niveau']) ? trim($_GET['niveau']) : '';
    $collection = isset($_GET['collection']) ? trim($_GET['collection']) : '';
    $owner = isset($_GET['owner']) ? trim($_GET['owner']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = 20;
    $offset = ($page - 1) * $limit;

    // Construire la requête de base
    $query = "
        SELECT 
            l.idObjet,
            l.nom,
            l.infoPlus,
            l.photo,
            l.date,
            l.statut,
            c.nom as collection,
            u.prenomUtilisateur AS proprietaire_prenom,
            u.nomUtilisateur AS proprietaire_nom,
            n.nom as niveau_nom,
            r.nom as rangement_nom,
            lo.nom as local_nom,
            s.nom as site_nom
        FROM `Lego` l
        LEFT JOIN `Categorie` c ON l.idCategorie = c.idCategorie
        LEFT JOIN `Utilisateur` u ON l.Pro_idUtilisateur = u.idUtilisateur
        LEFT JOIN `Niveau` n ON l.idNiveau = n.idNiveau 
            AND l.idRangement = n.idRangement 
            AND l.idLocal = n.idLocal 
            AND l.idSite = n.idSite
        LEFT JOIN `Rangement` r ON l.idRangement = r.idRangement 
            AND l.idLocal = r.idLocal 
            AND l.idSite = r.idSite
        LEFT JOIN `Local` lo ON l.idLocal = lo.idLocal 
            AND l.idSite = lo.idSite
        LEFT JOIN `Site` s ON l.idSite = s.idSite
        WHERE 1=1
    ";

    $params = [];

    // Ajouter les filtres basés sur les critères
    if (!empty($name)) {
        $query .= " AND l.nom LIKE ?";
        $params[] = '%' . $name . '%';
    }

    if (!empty($site)) {
        $query .= " AND s.nom LIKE ?";
        $params[] = '%' . $site . '%';
    }

    if (!empty($local)) {
        $query .= " AND lo.nom LIKE ?";
        $params[] = '%' . $local . '%';
    }

    if (!empty($rangement)) {
        $query .= " AND r.nom LIKE ?";
        $params[] = '%' . $rangement . '%';
    }

    if (!empty($niveau)) {
        $query .= " AND n.nom LIKE ?";
        $params[] = '%' . $niveau . '%';
    }

    if (!empty($collection)) {
        $query .= " AND c.nom LIKE ?";
        $params[] = '%' . $collection . '%';
    }

    if (!empty($owner)) {
        $query .= " AND (u.nomUtilisateur LIKE ? OR u.prenomUtilisateur LIKE ?)";
        $params[] = '%' . $owner . '%';
        $params[] = '%' . $owner . '%';
    }

    if (!empty($status)) {
        $query .= " AND l.statut = ?";
        $params[] = $status;
    }

    // Compter le total des résultats
    $countQuery = "SELECT COUNT(*) as total FROM (
        SELECT l.idObjet FROM `Lego` l
        LEFT JOIN `Categorie` c ON l.idCategorie = c.idCategorie
        LEFT JOIN `Utilisateur` u ON l.Pro_idUtilisateur = u.idUtilisateur
        LEFT JOIN `Niveau` n ON l.idNiveau = n.idNiveau 
            AND l.idRangement = n.idRangement 
            AND l.idLocal = n.idLocal 
            AND l.idSite = n.idSite
        LEFT JOIN `Rangement` r ON l.idRangement = r.idRangement 
            AND l.idLocal = r.idLocal 
            AND l.idSite = r.idSite
        LEFT JOIN `Local` lo ON l.idLocal = lo.idLocal 
            AND l.idSite = lo.idSite
        LEFT JOIN `Site` s ON l.idSite = s.idSite
        WHERE 1=1
    ";

    // Ajouter les mêmes filtres au comptage
    $countParams = [];
    if (!empty($name)) {
        $countQuery .= " AND l.nom LIKE ?";
        $countParams[] = '%' . $name . '%';
    }
    if (!empty($site)) {
        $countQuery .= " AND s.nom LIKE ?";
        $countParams[] = '%' . $site . '%';
    }
    if (!empty($local)) {
        $countQuery .= " AND lo.nom LIKE ?";
        $countParams[] = '%' . $local . '%';
    }
    if (!empty($rangement)) {
        $countQuery .= " AND r.nom LIKE ?";
        $countParams[] = '%' . $rangement . '%';
    }
    if (!empty($niveau)) {
        $countQuery .= " AND n.nom LIKE ?";
        $countParams[] = '%' . $niveau . '%';
    }
    if (!empty($collection)) {
        $countQuery .= " AND c.nom LIKE ?";
        $countParams[] = '%' . $collection . '%';
    }

    if (!empty($owner)) {
        $countQuery .= " AND (u.nomUtilisateur LIKE ? OR u.prenomUtilisateur LIKE ?)";
        $countParams[] = '%' . $owner . '%';
        $countParams[] = '%' . $owner . '%';
    }

    if (!empty($status)) {
        $countQuery .= " AND l.statut = ?";
        $countParams[] = $status;
    }

    $countQuery .= ") as filtered_results";

    $stmtCount = $pdo->prepare($countQuery);
    $stmtCount->execute($countParams);
    $countResult = $stmtCount->fetch(PDO::FETCH_ASSOC);
    $total = $countResult['total'];
    $totalPages = $total > 0 ? ceil($total / $limit) : 1;

    // Ajouter le tri et la pagination (LIMIT et OFFSET ne peuvent pas être des paramètres liés)
    $query .= " ORDER BY l.date DESC LIMIT " . intval($limit) . " OFFSET " . intval($offset);

    // Exécuter la requête
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $sets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'sets' => $sets,
        'page' => (int)$page,
        'totalPages' => $totalPages,
        'total' => $total
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("Database Error in search_sets.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in search_sets.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur: ' . $e->getMessage()
    ]);
}
?>
