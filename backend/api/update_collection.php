<?php
session_start();
header('Content-Type: application/json');

include '../config.php';

// Vérification des permissions : réservé aux administrateurs
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Accès refusé. Cette fonctionnalité est réservée aux administrateurs.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $idCategorie = $_POST['idCategorie'] ?? '';
    $nom = $_POST['nom'] ?? '';
    $infoPlus = $_POST['infoPlus'] ?? '';
    $photo = null;

    if (!$idCategorie || !$nom) {
        echo json_encode(['success' => false, 'message' => 'Les champs obligatoires sont manquants.']);
        exit;
    }

    // Vérifier si une photo a été uploadée
    if (!empty($_FILES['photoFile']) && $_FILES['photoFile']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileName = uniqid('collection_', true) . '.' . pathinfo($_FILES['photoFile']['name'], PATHINFO_EXTENSION);
        $uploadPath = $uploadDir . $fileName;

        if (move_uploaded_file($_FILES['photoFile']['tmp_name'], $uploadPath)) {
            $photo = 'uploads/' . $fileName;
        } else {
            echo json_encode(['success' => false, 'message' => 'Erreur lors du téléchargement de la photo.']);
            exit;
        }
    } elseif (!empty($_POST['photo'])) {
        // Utiliser l'URL fournie
        $photo = $_POST['photo'];
    }

    try {
        if ($photo !== null) {
            $stmt = $pdo->prepare("UPDATE Categorie SET nom = ?, infoPlus = ?, photo = ? WHERE idCategorie = ?");
            $stmt->execute([$nom, $infoPlus, $photo, $idCategorie]);
        } else {
            $stmt = $pdo->prepare("UPDATE Categorie SET nom = ?, infoPlus = ? WHERE idCategorie = ?");
            $stmt->execute([$nom, $infoPlus, $idCategorie]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Catégorie mise à jour avec succès.',
            'photo' => $photo
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée.']);
}
?>
