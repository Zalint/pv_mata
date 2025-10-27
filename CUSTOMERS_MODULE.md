# Module Gestion des Clients

## Vue d'ensemble

Le module de gestion des clients permet d'enregistrer et suivre les commandes des clients pour chaque point de vente. Il inclut des fonctionnalités d'évaluation de la satisfaction client et de détection automatique des clients récurrents.

## Fonctionnalités

### ✅ Gestion des clients
- Ajout de nouveaux clients/commandes
- Modification des informations
- Suppression (réservé aux ADMIN)
- Affichage détaillé avec notes d'évaluation

### ✅ Détection automatique
- **Type client** : Détection automatique si le numéro de téléphone existe déjà
  - 🔵 **Nouveau** : Premier enregistrement du numéro
  - 🟢 **Récurrent** : Numéro déjà présent dans la base

### ✅ Évaluation de satisfaction
- **Note qualité des produits** (0-10)
- **Note niveau de prix** (0-10)
- **Note service commercial** (0-10)
- **Note globale** : Moyenne automatique des 3 notes

### ✅ Statistiques en temps réel
- Total des commandes
- Montant total en FCFA
- Répartition Nouveaux/Récurrents
- Note moyenne globale

## Accès au module

1. Connectez-vous à l'application
2. Dans la liste des activités, cliquez sur le bouton **👥 Clients** dans la colonne Actions
3. Le modal s'ouvre avec la liste des clients pour ce point de vente et cette date

## Utilisation

### Ajouter une commande

1. Cliquez sur **+ Ajouter une commande**
2. Remplissez le formulaire :
   - **Date** : Date de la commande
   - **Téléphone** : Le système détecte automatiquement si c'est un nouveau client ou récurrent
   - **Nom du client**
   - **Point de vente**
   - **Montant** (FCFA)
   - **Comment nous avez-vous connu ?**
   - **Commentaire client**
3. Évaluez avec les sliders (0-10):
   - Qualité des produits
   - Niveau de prix
   - Service commercial
4. La note globale se calcule automatiquement
5. Cliquez sur **Enregistrer**

### Modifier une commande

1. Cliquez sur l'icône ✏️ dans les actions
2. Modifiez les informations
3. Cliquez sur **Enregistrer**

**Note** : Les MANAGER peuvent modifier uniquement leurs propres enregistrements

### Supprimer une commande

1. Cliquez sur l'icône 🗑️ (réservé aux ADMIN)
2. Confirmez la suppression

### Voir les détails

Cliquez sur l'icône 👁️ pour afficher/masquer les détails d'un client (notes détaillées et commentaire complet)

## Structure des données

### Champs obligatoires (*)
- Date
- Numéro de téléphone
- Nom du client
- Point de vente
- Montant de la commande
- Type client (Nouveau/Récurrent)

### Champs optionnels
- Comment nous avez-vous connu
- Commentaire client
- Note qualité produits
- Note niveau prix
- Note service commercial

## Base de données

### Table: `customers`

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    nom_client VARCHAR(100) NOT NULL,
    point_vente VARCHAR(100) NOT NULL,
    montant_commande INTEGER NOT NULL,
    type_client VARCHAR(20) NOT NULL,
    comment_connu TEXT,
    commentaire_client TEXT,
    note_qualite_produits DECIMAL(3,1),
    note_niveau_prix DECIMAL(3,1),
    note_service_commercial DECIMAL(3,1),
    note_globale DECIMAL(3,1) GENERATED,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Initialisation de la table

```bash
# Se connecter à PostgreSQL
psql -U zalint -d pv_data

# Exécuter le script
\i sql/create_customers_table.sql
```

Ou via Node.js:
```bash
node -e "const pool = require('./config/db'); const fs = require('fs'); const sql = fs.readFileSync('./sql/create_customers_table.sql', 'utf8'); pool.query(sql).then(() => console.log('Table créée')).catch(err => console.error(err));"
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/customers | Liste des clients (avec filtres) |
| GET | /api/customers/:id | Détails d'un client |
| GET | /api/customers/stats | Statistiques |
| GET | /api/customers/check-phone | Vérifier si téléphone existe |
| POST | /api/customers | Créer un client |
| PUT | /api/customers/:id | Modifier un client |
| DELETE | /api/customers/:id | Supprimer un client (ADMIN) |

### Filtres disponibles
- `activity_id` : ID de l'activité
- `date` : Date (YYYY-MM-DD)
- `point_vente` : Nom du point de vente
- `type_client` : Nouveau ou Récurrent

## Permissions

| Rôle | Créer | Modifier | Supprimer | Voir |
|------|-------|----------|-----------|------|
| **ADMIN** | ✅ | ✅ Tous | ✅ | ✅ |
| **MANAGER** | ✅ | ✅ Ses enregistrements | ❌ | ✅ |

## Fichiers du module

```
├── models/customer.js           # Modèle de données
├── routes/customers.js          # Routes API
├── public/
│   ├── css/customers.css       # Styles du module
│   └── js/customers.js         # Logique frontend
└── sql/create_customers_table.sql  # Script d'initialisation DB
```

## Exemple de données

```json
{
  "date": "2025-10-27",
  "telephone": "+221 77 123 45 67",
  "nom_client": "Amadou Diallo",
  "point_vente": "Sacre Coeur",
  "montant_commande": 15000,
  "type_client": "Nouveau",
  "comment_connu": "Réseaux sociaux",
  "commentaire_client": "Très satisfait du service",
  "note_qualite_produits": 9.0,
  "note_niveau_prix": 8.0,
  "note_service_commercial": 9.5,
  "note_globale": 8.8
}
```

## Notes techniques

- **Calcul automatique** : La note globale est calculée automatiquement par la base de données
- **Validation** : Les notes doivent être entre 0 et 10
- **Cascade** : Si une activité est supprimée, les clients associés sont aussi supprimés
- **Index** : Optimisations sur telephone, date, point_vente pour des recherches rapides

## Support

Pour toute question ou problème :
1. Vérifiez que la table `customers` existe
2. Vérifiez les permissions de votre utilisateur
3. Consultez les logs du serveur pour les erreurs
