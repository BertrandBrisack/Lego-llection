<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

include '../config.php';

try {
    // Vérifier si l'utilisateur est connecté
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
        exit;
    }

    $userId = $_SESSION['user']['idUtilisateur'];

    // Récupérer l'ID de l'objet depuis POST
    if (!isset($_POST['idObjet'])) {
        echo json_encode(['success' => false, 'error' => 'ID de l\'objet manquant']);
        exit;
    }

    $idObjet = trim($_POST['idObjet']);

    // Vérifier que l'objet existe et est disponible
    $stmt = $pdo->prepare("SELECT statut, idOwner FROM Lego WHERE idObjet = ?");
    $stmt->execute([$idObjet]);
    $set = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$set) {
        echo json_encode(['success' => false, 'error' => 'Objet non trouvé']);
        exit;
    }

    // Vérifier si l'objet est disponible
    if (strtolower(trim($set['statut'])) !== 'disponible') {
        echo json_encode(['success' => false, 'error' => 'Cet objet n\'est pas disponible pour l\'emprunt']);
        exit;
    }

    // Vérifier que l'utilisateur n'emprunte pas son propre objet
    if ($set['idOwner'] === $userId) {
        echo json_encode(['success' => false, 'error' => 'Vous ne pouvez pas emprunter votre propre objet']);
        exit;
    }

    // Mettre à jour le statut et l'emprunteur
    $stmt = $pdo->prepare("UPDATE Lego SET statut = 'emprunté', idBorrower = ? WHERE idObjet = ?");
    $stmt->execute([$userId, $idObjet]);

    echo json_encode(['success' => true, 'message' => 'Objet emprunté avec succès']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Erreur lors de l\'emprunt: ' . $e->getMessage()]);
}
?>