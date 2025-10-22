# 📊 Application de Gestion des Activités - Point de Vente

Application web complète pour gérer les activités quotidiennes des points de vente avec système d'authentification et gestion des rôles.

## 🚀 Fonctionnalités

- ✅ Authentification sécurisée avec JWT
- ✅ Gestion des rôles (MANAGER et ADMIN)
- ✅ Création et modification d'activités
- ✅ Historique des activités avec filtres
- ✅ Notes avec virgules (ex: 8,5)
- ✅ Commentaires sur les livreurs
- ✅ API RESTful complète
- ✅ Interface moderne et responsive

## 📋 Prérequis

- Node.js (v14 ou supérieur)
- PostgreSQL (v12 ou supérieur)
- npm ou yarn

## 🛠️ Installation

### 1. Cloner le projet

```bash
cd C:\Mata\PV
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer PostgreSQL

Créer la base de données :

```sql
CREATE DATABASE pv_data;
```

### 4. Configurer les variables d'environnement

Copier le fichier `.env.example` vers `.env` :

```bash
copy .env.example .env
```

Modifier le fichier `.env` avec vos paramètres :

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pv_data
DB_USER=zalint
DB_PASSWORD=bonea2024

# JWT Configuration
JWT_SECRET=votre_secret_jwt_tres_securise_changez_moi
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=development

# Users Configuration
USER_DIDI_USERNAME=DIDI
USER_DIDI_PASSWORD=didi2024
USER_DIDI_ROLE=MANAGER

USER_ADMIN_USERNAME=ADMIN
USER_ADMIN_PASSWORD=admin2024
USER_ADMIN_ROLE=ADMIN
```

### 5. Initialiser la base de données

```bash
node sql/init-db.js
```

Cette commande va :
- Créer les tables `users` et `activities`
- Insérer les utilisateurs DIDI (MANAGER) et ADMIN (ADMIN)
- Configurer les triggers et index

## 🎯 Démarrage

### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

### Mode production

```bash
npm start
```

L'application sera accessible sur : **http://localhost:3000**

## 👥 Utilisateurs par défaut

| Username | Password | Rôle | Permissions |
|----------|----------|------|-------------|
| DIDI | didi2024 | MANAGER | Créer, Modifier ses activités (< 24h) |
| ADMIN | admin2024 | ADMIN | Tout faire (créer, modifier, supprimer) |

## 📡 API Endpoints

### Authentification

```
POST /api/auth/login
Body: { "username": "DIDI", "password": "didi2024" }
Response: { "token": "...", "user": {...} }
```

### Activités

```
GET    /api/activities
       Query params (optionnels):
       - dateDebut: YYYY-MM-DD
       - dateFin: YYYY-MM-DD
       - pointVente: string

POST   /api/activities
       Body: { date, point_vente, responsable, note_ventes, ... }

PUT    /api/activities/:id
       Body: { date, point_vente, responsable, ... }

DELETE /api/activities/:id (ADMIN uniquement)
```

### Métadonnées

```
GET /api/activities/meta/points-vente
GET /api/activities/meta/responsables
```

## 🔐 Règles de Gestion

### MANAGER (DIDI)
- ✅ Créer de nouvelles activités
- ✅ Modifier ses propres activités dans les 24h
- ✅ Consulter toutes les activités
- ❌ Supprimer des activités
- ❌ Modifier après 24h

### ADMIN
- ✅ Toutes les permissions
- ✅ Créer, modifier, supprimer sans restriction
- ✅ Modifier toutes les activités (sans limite de temps)

## 📝 Validation des Données

### Note des ventes
- Format : Nombre entre 1 et 10
- **Accepte les virgules** : `8,5` ou `9,2`
- Regex : `^([1-9]|10)(,[0-9]+)?$`

### Champs requis
- Date
- Point de vente
- Responsable
- Note des ventes
- Plaintes client
- Produits manquants
- Commentaire sur les livreurs
- Commentaire général

## 🗂️ Structure du Projet

```
pv-app/
├── config/
│   └── db.js                    # Configuration PostgreSQL
├── middleware/
│   ├── auth.js                  # Authentification JWT
│   └── roleCheck.js             # Vérification des rôles
├── models/
│   ├── user.js                  # Modèle utilisateur
│   └── activity.js              # Modèle activité
├── routes/
│   ├── auth.js                  # Routes d'authentification
│   └── activities.js            # Routes des activités
├── public/
│   ├── index.html               # Interface principale
│   ├── css/
│   │   └── style.css            # Styles
│   └── js/
│       ├── auth.js              # Auth client
│       └── app.js               # Logique principale
├── sql/
│   ├── init.sql                 # Script SQL
│   └── init-db.js               # Initialisation DB
├── .env                         # Variables d'environnement
├── .env.example                 # Template .env
├── package.json
├── server.js                    # Serveur Express
└── README.md
```

## 🎨 Interface Utilisateur

### Formulaire de Saisie
- Date (sélecteur de date)
- Point de vente (avec autocomplétion)
- Responsable (avec autocomplétion)
- Note des ventes (1-10, virgules acceptées)
- Plaintes client (textarea)
- Produits manquants (textarea)
- **Commentaire sur les livreurs** (textarea)
- Commentaire général (textarea)

### Historique
- Tableau avec toutes les activités
- Ordre décroissant par date
- Filtres : date début, date fin, point de vente
- Actions : Modifier, Supprimer (selon permissions)

## 🔧 Commandes Utiles

```bash
# Installer les dépendances
npm install

# Initialiser la base de données
node sql/init-db.js

# Démarrer en mode développement
npm run dev

# Démarrer en mode production
npm start

# Réinitialiser la base de données
node sql/init-db.js
```

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials dans `.env`
- Vérifier que la base `pv_data` existe

### Token expiré
- Se déconnecter et se reconnecter
- Par défaut, les tokens expirent après 24h

### Erreur "Cannot find module"
- Exécuter `npm install`

## 📚 Technologies Utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : PostgreSQL
- **Authentification** : JWT (jsonwebtoken)
- **Sécurité** : bcrypt pour le hachage des mots de passe
- **Frontend** : HTML5, CSS3, JavaScript (Vanilla)

## 🔒 Sécurité

- Mots de passe hashés avec bcrypt
- Authentification JWT
- Protection des routes avec middleware
- Validation des données côté serveur et client
- Protection contre les injections SQL (requêtes paramétrées)
- Échappement HTML côté client

## 📄 Licence

ISC

## 👨‍💻 Auteur

Application développée pour la gestion des activités des points de vente.

---

**Note** : N'oubliez pas de changer le `JWT_SECRET` dans le fichier `.env` en production !
