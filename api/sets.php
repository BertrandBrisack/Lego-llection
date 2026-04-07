<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

$page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$limit = 10;
$offset = ($page - 1) * $limit;

try {
    // Compter les sets
    $stmtCount = $pdo->query("SELECT COUNT(*) as total FROM Lego");
    $count = $stmtCount->fetch(PDO::FETCH_ASSOC);
    $total = $count['total'];
    $totalPages = $total > 0 ? ceil($total / $limit) : 1;

    // Si aucun set, retourner une réponse vide
    if ($total == 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'sets' => [],
            'page' => 1,
            'totalPages' => 1,
            'total' => 0
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Récupérer les sets (note : LOCAL peut être réservé, donc on échappe le nom de table)
    $query = "
        SELECT 
            l.idObjet,
            l.nom,
            l.infoPlus,
            l.photo,
            l.date,
            l.statut,
            c.nom as categorie,
            u.login AS proprietaire_login,
            u.prenomUtilisateur AS proprietaire_prenom,
            u.nomUtilisateur AS proprietaire_nom,
            n.nom as niveau_nom,
            r.nom as rangement_nom,
            lo.nom as local_nom,
            s.nom as site_nom
        FROM `Lego` l
        LEFT JOIN `Categorie` c ON l.idCategorie = c.idCategorie
        LEFT JOIN `Utilisateur` u ON l.idOwner = u.idUtilisateur
        LEFT JOIN `Niveau` n ON l.idNiveau = n.idNiveau
        LEFT JOIN `Rangement` r ON n.idRangement = r.idRangement
        LEFT JOIN `Local` lo ON r.idLocal = lo.idLocal
        LEFT JOIN `Site` s ON lo.idSite = s.idSite
        ORDER BY l.date DESC
        LIMIT ? OFFSET ?
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->bindValue(2, $offset, PDO::PARAM_INT);
    $stmt->execute();
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
    error_log("Database Error in sets.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur base de données: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error in sets.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur: ' . $e->getMessage()
    ]);
}