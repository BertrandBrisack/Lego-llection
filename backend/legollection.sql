drop database if exists legollection;


-- Création de la base
CREATE DATABASE IF NOT EXISTS legollection
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE legollection;

-- ============================
--   TABLES
-- ============================

CREATE TABLE Categorie (
    idCategorie VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoPlus VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    PRIMARY KEY (idCategorie)
) ENGINE=InnoDB;

CREATE TABLE Utilisateur (
    idUtilisateur VARCHAR(50) NOT NULL,
    nomUtilisateur VARCHAR(50) NOT NULL,
    prenomUtilisateur VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    PRIMARY KEY (idUtilisateur)
) ENGINE=InnoDB;

CREATE TABLE Site (
    idSite VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    adresse VARCHAR(50) NOT NULL,
    codePostal VARCHAR(50) NOT NULL,
    localite VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    idResponsable VARCHAR(50) NOT NULL,
    PRIMARY KEY (idSite),
    FOREIGN KEY (idResponsable)
        REFERENCES Utilisateur(idUtilisateur)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Local (
    idLocal VARCHAR(50) NOT NULL,
    idSite VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoLocal VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    PRIMARY KEY (idLocal),
    FOREIGN KEY (idSite)
        REFERENCES Site(idSite)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Rangement (
    idRangement VARCHAR(50) NOT NULL,
    idLocal VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoRangement VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    PRIMARY KEY (idRangement),
    FOREIGN KEY (idLocal)
        REFERENCES Local(idLocal)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Niveau (
    idNiveau VARCHAR(50) NOT NULL,
    idRangement VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoNiveau VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    PRIMARY KEY (idNiveau),
    FOREIGN KEY (idRangement)
        REFERENCES Rangement(idRangement)
        ON UPDATE RESTRICT ON DELETE CASCADE
) ENGINE=InnoDB;



CREATE TABLE Lego (
    idObjet VARCHAR(50) NOT NULL,
    idNiveau VARCHAR(50),
    idCategorie VARCHAR(50) NOT NULL,
    idOwner VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoRangement VARCHAR(50) NOT NULL,
    photo VARCHAR(255) NOT NULL,
    infoPlus VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    idBorrower VARCHAR(50),
    PRIMARY KEY (idObjet),

    FOREIGN KEY (idBorrower)
        REFERENCES Utilisateur(idUtilisateur)
        ON UPDATE RESTRICT ON DELETE SET NULL,

    FOREIGN KEY (idOwner)
        REFERENCES Utilisateur(idUtilisateur)
        ON UPDATE RESTRICT ON DELETE RESTRICT,

    FOREIGN KEY (idCategorie)
        REFERENCES Categorie(idCategorie)
        ON UPDATE RESTRICT ON DELETE RESTRICT,

    FOREIGN KEY (idNiveau)
        REFERENCES Niveau(idNiveau)
        ON UPDATE RESTRICT ON DELETE SET NULL
) ENGINE=InnoDB;
