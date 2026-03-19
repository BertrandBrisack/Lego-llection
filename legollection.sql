
-- Création de la base
CREATE DATABASE IF NOT EXISTS Legollection
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE Legollection;

-- ============================
--   TABLES
-- ============================

CREATE TABLE Categorie (
    idCategorie VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoPlus VARCHAR(50) NOT NULL,
    PRIMARY KEY (idCategorie)
) ENGINE=InnoDB;

CREATE TABLE Site (
    idSite VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    adresse VARCHAR(50) NOT NULL,
    codePostal VARCHAR(50) NOT NULL,
    localite VARCHAR(50) NOT NULL,
    photo VARCHAR(50) NOT NULL,
    PRIMARY KEY (idSite)
) ENGINE=InnoDB;

CREATE TABLE Local (
    idSite VARCHAR(50) NOT NULL,
    idLocal VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoLocal VARCHAR(50) NOT NULL,
    photo VARCHAR(50) NOT NULL,
    PRIMARY KEY (idLocal, idSite),
    FOREIGN KEY (idSite)
        REFERENCES Site(idSite)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Rangement (
    idLocal VARCHAR(50) NOT NULL,
    idSite VARCHAR(50) NOT NULL,
    idRangement VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoRangement VARCHAR(50) NOT NULL,
    photo VARCHAR(50) NOT NULL,
    PRIMARY KEY (idRangement, idLocal, idSite),
    FOREIGN KEY (idLocal, idSite)
        REFERENCES Local(idLocal, idSite)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Niveau (
    idRangement VARCHAR(50) NOT NULL,
    idLocal VARCHAR(50) NOT NULL,
    idSite VARCHAR(50) NOT NULL,
    idNiveau VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoNiveau VARCHAR(50) NOT NULL,
    photo VARCHAR(50) NOT NULL,
    PRIMARY KEY (idNiveau, idRangement, idLocal, idSite),
    FOREIGN KEY (idRangement, idLocal, idSite)
        REFERENCES Rangement(idRangement, idLocal, idSite)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Utilisateur (
    idUtilisateur VARCHAR(50) NOT NULL,
    nomUtilisateur VARCHAR(50) NOT NULL,
    prenomUtilisateur VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login VARCHAR(50) NOT NULL,
    mdp VARCHAR(50) NOT NULL,
    PRIMARY KEY (idUtilisateur)
) ENGINE=InnoDB;

CREATE TABLE Lego (
    idNiveau VARCHAR(50) NOT NULL,
    idRangement VARCHAR(50) NOT NULL,
    idLocal VARCHAR(50) NOT NULL,
    idSite VARCHAR(50) NOT NULL,
    idCategorie VARCHAR(50) NOT NULL,
    Pro_idUtilisateur VARCHAR(50) NOT NULL,
    idObjet VARCHAR(50) NOT NULL,
    nom VARCHAR(50) NOT NULL,
    infoRangement VARCHAR(50) NOT NULL,
    photo VARCHAR(50) NOT NULL,
    infoPlus VARCHAR(50) NOT NULL,
    date VARCHAR(50) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    idUtilisateur VARCHAR(50),
    PRIMARY KEY (idObjet, idNiveau, idRangement, idLocal, idSite, idCategorie, Pro_idUtilisateur),

    FOREIGN KEY (idUtilisateur)
        REFERENCES Utilisateur(idUtilisateur)
        ON UPDATE RESTRICT ON DELETE SET NULL,

    FOREIGN KEY (Pro_idUtilisateur)
        REFERENCES Utilisateur(idUtilisateur)
        ON UPDATE RESTRICT ON DELETE RESTRICT,

    FOREIGN KEY (idCategorie)
        REFERENCES Categorie(idCategorie)
        ON UPDATE RESTRICT ON DELETE RESTRICT,

    FOREIGN KEY (idNiveau, idRangement, idLocal, idSite)
        REFERENCES Niveau(idNiveau, idRangement, idLocal, idSite)
        ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB;
