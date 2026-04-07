<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user']) || !isset($_SESSION['user']['idUtilisateur'])) {
        echo json_encode(['success' => false, 'message' => 'Vous devez être connecté pour ajouter un site.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'user') {
        echo json_encode(['success' => false, 'message' => 'Seuls les propriétaires peuvent ajouter un site.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $nom = trim($_POST['nom'] ?? '');
    $adresse = trim($_POST['adresse'] ?? '');
    $codePostal = trim($_POST['codePostal'] ?? '');
    $localite = trim($_POST['localite'] ?? '');
    $photo = trim($_POST['photo'] ?? '');
    $idResponsable = $_SESSION['user']['idUtilisateur'];

    if ($nom !== '' && $adresse !== '' && $codePostal !== '' && $localite !== '') {
        $idSite = uniqid('site_', true);

        try {
            $stmt = $pdo->prepare("INSERT INTO Site (idSite, nom, adresse, codePostal, localite, photo, idResponsable) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$idSite, $nom, $adresse, $codePostal, $localite, $photo, $idResponsable]);

            echo json_encode(['success' => true, 'message' => 'Site ajouté avec succès.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Erreur lors de l\'ajout du site : ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Veuillez remplir tous les champs obligatoires.'], JSON_UNESCAPED_UNICODE);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.'], JSON_UNESCAPED_UNICODE);
}
?>