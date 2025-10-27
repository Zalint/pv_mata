-- Table pour gérer les clients et commandes
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    nom_client VARCHAR(100) NOT NULL,
    point_vente VARCHAR(100) NOT NULL,
    montant_commande INTEGER NOT NULL CHECK (montant_commande >= 0),
    type_client VARCHAR(20) NOT NULL CHECK (type_client IN ('Nouveau', 'Récurrent')),
    comment_connu TEXT,
    commentaire_client TEXT,
    note_qualite_produits DECIMAL(3,1) CHECK (note_qualite_produits >= 0 AND note_qualite_produits <= 10),
    note_niveau_prix DECIMAL(3,1) CHECK (note_niveau_prix >= 0 AND note_niveau_prix <= 10),
    note_service_commercial DECIMAL(3,1) CHECK (note_service_commercial >= 0 AND note_service_commercial <= 10),
    note_globale DECIMAL(3,1) GENERATED ALWAYS AS (
        CASE 
            WHEN note_qualite_produits IS NOT NULL 
                 AND note_niveau_prix IS NOT NULL 
                 AND note_service_commercial IS NOT NULL
            THEN (note_qualite_produits + note_niveau_prix + note_service_commercial) / 3
            ELSE NULL
        END
    ) STORED,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customers_activity ON customers(activity_id);
CREATE INDEX IF NOT EXISTS idx_customers_telephone ON customers(telephone);
CREATE INDEX IF NOT EXISTS idx_customers_date ON customers(date);
CREATE INDEX IF NOT EXISTS idx_customers_point_vente ON customers(point_vente);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE customers IS 'Table des clients et commandes par point de vente';
COMMENT ON COLUMN customers.type_client IS 'Nouveau: première commande, Récurrent: client existant';
COMMENT ON COLUMN customers.note_globale IS 'Moyenne automatique des 3 notes sur 10';
