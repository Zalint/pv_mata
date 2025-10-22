-- Script d'initialisation de la base de données pv_data
-- À exécuter manuellement dans PostgreSQL ou via le script init-db.js

-- Créer la base de données (si elle n'existe pas)
-- CREATE DATABASE pv_data;

-- Se connecter à la base de données
-- \c pv_data

-- Supprimer les tables si elles existent (pour réinitialisation)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: activities
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    point_vente VARCHAR(100) NOT NULL,
    responsable VARCHAR(100) NOT NULL,
    note_ventes VARCHAR(10),
    plaintes_client TEXT,
    produits_manquants TEXT,
    commentaire_livreurs TEXT,
    commentaire TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_activities_date ON activities(date DESC);
CREATE INDEX idx_activities_point_vente ON activities(point_vente);
CREATE INDEX idx_activities_created_by ON activities(created_by);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Les utilisateurs seront insérés via le script Node.js avec les mots de passe hashés
