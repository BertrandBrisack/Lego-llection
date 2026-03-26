-- Script de migration pour la nouvelle structure simplifiée de la DB
-- À exécuter APRÈS avoir sauvegardé vos données existantes

-- ATTENTION: Ce script suppose que les IDs sont uniques globalement
-- Si vous avez des IDs dupliqués entre sites/locaux, vous devrez les ajuster manuellement

-- CHANGEMENTS DE NOMMAGE:
-- Ancien: Pro_idUtilisateur → Nouveau: idOwner (propriétaire)
-- Ancien: idUtilisateur → Nouveau: idBorrower (emprunteur)

-- 1. Sauvegarder les données existantes (FAITES-LE AVANT!)
-- mysqldump legollection > backup_before_migration.sql

-- 2. Supprimer et recréer la base
DROP DATABASE IF EXISTS Legollection;
SOURCE legollection.sql;

-- 3. Si vous aviez des données, vous devrez les réinsérer manuellement
-- en adaptant les nouvelles structures (sans les colonnes redondantes)

-- Exemple de migration manuelle pour quelques enregistrements:
-- INSERT INTO Site (idSite, nom, ...) VALUES (...);
-- INSERT INTO Local (idLocal, idSite, nom, ...) VALUES (...);
-- INSERT INTO Rangement (idRangement, idLocal, nom, ...) VALUES (...);
-- INSERT INTO Niveau (idNiveau, idRangement, nom, ...) VALUES (...);
-- INSERT INTO Lego (idObjet, idNiveau, idCategorie, idOwner, idBorrower, nom, ...) VALUES (...);