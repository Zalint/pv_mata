# 📐 Architecture Technique - Application PV

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Backend - Serveur Node.js](#backend---serveur-nodejs)
4. [Configuration](#configuration)
5. [Base de données](#base-de-données)
6. [Modèles](#modèles)
7. [Middleware](#middleware)
8. [Routes API](#routes-api)
9. [Frontend](#frontend)
10. [Flux de données](#flux-de-données)
11. [Sécurité](#sécurité)

---

## 🎯 Vue d'ensemble

L'application est une **architecture client-serveur** classique avec :
- **Backend** : API REST en Node.js/Express
- **Frontend** : Application web SPA (Single Page Application) en JavaScript vanilla
- **Base de données** : PostgreSQL
- **Authentification** : JWT (JSON Web Tokens)

```
┌─────────────────────────────────────────────────┐
│             CLIENT (Navigateur)                  │
│   HTML/CSS/JavaScript + LocalStorage (JWT)      │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/REST API
                  │ (JSON)
┌─────────────────┴───────────────────────────────┐
│         SERVER (Node.js + Express)               │
│  Routes → Middleware → Modèles → PostgreSQL     │
└──────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture générale

### Structure du projet

```
pv-app/
├── config/              # Configuration (DB, etc.)
├── middleware/          # Middlewares Express
├── models/              # Modèles de données
├── routes/              # Routes API
├── public/              # Frontend (fichiers statiques)
│   ├── css/
│   ├── js/
│   └── data/           # Données JSON statiques
├── sql/                 # Scripts SQL
├── .env                 # Variables d'environnement
├── server.js            # Point d'entrée du serveur
└── package.json         # Dépendances npm
```

### Flux de traitement d'une requête

```
Client → Express → Middleware Auth → Middleware Role → Route Handler → Modèle → PostgreSQL
                                                                                      ↓
Client ← JSON ←────────────────────────────────────────────────────────────────────────────────────┘
```

### Architecture MVC

Notre application suit le pattern **MVC (Model-View-Controller)** :

```
┌─────────────────────────────────────────────────┐
│                    MVC Pattern                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  MODEL          ←→   CONTROLLER   ←→   VIEW     │
│                                                  │
│  models/             routes/           public/   │
│  ├─ user.js          ├─ auth.js       ├─ index.html│
│  └─ activity.js      └─ activities.js └─ app.js │
│                                                  │
│  (Données)           (Logique)         (Interface)│
└─────────────────────────────────────────────────┘
```

#### 1. MODEL (`models/`) - Gestion des données

```javascript
// models/activity.js
class Activity {
    static async findAll(filters) {
        // Interaction avec la base de données
        const result = await pool.query('SELECT * FROM activities...');
        return result.rows;
    }
}
```

**Responsabilité** :
- ✅ Requêtes SQL
- ✅ Validation des données
- ✅ Logique métier liée aux données

#### 2. CONTROLLER (`routes/`) - Logique de contrôle

```javascript
// routes/activities.js
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { dateDebut, dateFin, pointVente } = req.query;  // 1. Récupérer params
        
        const filters = {};                                     // 2. Préparer données
        if (dateDebut) filters.dateDebut = dateDebut;
        
        const activities = await Activity.findAll(filters);     // 3. Appeler Model
        
        res.json(activities);                                   // 4. Retourner réponse
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });    // 5. Gérer erreurs
    }
});
```

**Responsabilité** :
- ✅ Recevoir les requêtes HTTP
- ✅ Valider les paramètres
- ✅ Appeler les Modèles
- ✅ Gérer les erreurs
- ✅ Retourner les réponses (JSON)
- ✅ Appliquer les middlewares (auth, validation)

#### 3. VIEW (`public/`) - Interface utilisateur

```javascript
// public/js/app.js
async loadActivities() {
    const response = await fetch('/api/activities');  // Appelle le Controller
    const activities = await response.json();
    // Afficher dans le DOM
}
```

**Responsabilité** :
- ✅ Affichage (HTML/CSS)
- ✅ Interaction utilisateur
- ✅ Appels API vers les Controllers

#### Flux complet d'une requête MVC

```
1. VIEW (public/js/app.js)
   → fetch('/api/activities?pointVente=O.Foire')
   
2. CONTROLLER (routes/activities.js)
   → Récupère les paramètres : req.query.pointVente
   → Appelle le Model : Activity.findAll({ pointVente: 'O.Foire' })
   
3. MODEL (models/activity.js)
   → Exécute la requête SQL
   → Retourne les données au Controller
   
4. CONTROLLER (routes/activities.js)
   → Formate la réponse : res.json(activities)
   
5. VIEW (public/js/app.js)
   → Reçoit les données
   → Affiche dans le tableau
```

**Résumé** : Les `routes/` jouent le rôle de **Controllers** dans notre architecture MVC.

---

## 🖥️ Backend - Serveur Node.js

### Rôle d'Express

**Express** est un framework web minimaliste pour Node.js qui simplifie la création de serveurs HTTP et d'APIs.

**Pourquoi Express ?**
- ✅ **Routing simplifié** : `app.get()`, `app.post()` au lieu de if/else
- ✅ **Parsing automatique** : JSON, URL, cookies parsés automatiquement
- ✅ **Middleware** : Chaîne de traitement (auth → validation → handler)
- ✅ **Organisation** : Code modulaire avec routes séparées
- ✅ **Simplicité** : 200 lignes Node.js pur = 20 lignes Express

**Dans notre app** : Express gère le routing (`/api/auth`, `/api/activities`), parse le JSON, applique les middlewares d'authentification, et sert les fichiers statiques (HTML/CSS/JS).

---

### `server.js` - Point d'entrée

**Rôle** : Initialiser et configurer le serveur Express.

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
```

**Responsabilités** :
1. ✅ Charger les variables d'environnement (`.env`)
2. ✅ Configurer les middlewares globaux (CORS, JSON, URL-encoded)
3. ✅ Servir les fichiers statiques (`public/`)
4. ✅ Monter les routes API (`/api/auth`, `/api/activities`)
5. ✅ Gérer les erreurs 404
6. ✅ Démarrer le serveur sur le port configuré

**Middlewares globaux** :
```javascript
app.use(cors());                              // Autoriser les requêtes cross-origin
app.use(express.json());                      // Parser les requêtes JSON
app.use(express.urlencoded({ extended: true })); // Parser les formulaires
app.use(express.static(path.join(__dirname, 'public'))); // Fichiers statiques
```

**Routes** :
```javascript
app.use('/api/auth', authRoutes);             // Authentification
app.use('/api/activities', activitiesRoutes); // Gestion des activités
```

---

## ⚙️ Configuration

### `config/db.js` - Configuration PostgreSQL

**Rôle** : Créer et gérer le pool de connexions PostgreSQL.

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,                      // Max 20 connexions simultanées
    idleTimeoutMillis: 30000,     // Timeout des connexions inactives
    connectionTimeoutMillis: 2000 // Timeout de connexion
});
```

**Pool de connexions** :
- Réutilise les connexions existantes (performance)
- Gère automatiquement la création/destruction des connexions
- Limite le nombre de connexions simultanées

**Events** :
```javascript
pool.on('connect', () => console.log('✅ Connecté à PostgreSQL'));
pool.on('error', (err) => console.error('❌ Erreur DB', err));
```

### `.env` - Variables d'environnement

**Rôle** : Stocker les configurations sensibles et spécifiques à l'environnement.

```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pv_data
DB_USER=zalint
DB_PASSWORD=bonea2024

# JWT
JWT_SECRET=f13a5963cbb6b4ab...
JWT_EXPIRES_IN=24h

# Serveur
PORT=3000
NODE_ENV=development

# Utilisateurs
USER_DIDI_USERNAME=DIDI
USER_DIDI_PASSWORD=didi2024
USER_DIDI_ROLE=MANAGER
...
```

**Pourquoi `.env` ?**
- ✅ Sépare la configuration du code
- ✅ Facilite le déploiement (dev/staging/prod)
- ✅ Protège les secrets (ne pas commit dans git)

---

## 🗄️ Base de données

### Schema PostgreSQL

#### Table `users`

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Index** :
- `PRIMARY KEY` sur `id` (auto-incrémenté)
- `UNIQUE` sur `username`

#### Table `activities`

```sql
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
```

**Index pour performance** :
```sql
CREATE INDEX idx_activities_date ON activities(date DESC);
CREATE INDEX idx_activities_point_vente ON activities(point_vente);
CREATE INDEX idx_activities_created_by ON activities(created_by);
```

**Trigger pour `updated_at`** :
```sql
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Initialisation

**`sql/init-db.js`** :
- Lit et exécute `sql/init.sql`
- Hashe les mots de passe avec bcrypt
- Insère les utilisateurs par défaut (DIDI, ADMIN)

---

## 📦 Modèles

Les modèles encapsulent la logique d'accès aux données.

### `models/user.js` - Modèle User

**Méthodes** :

```javascript
User.findByUsername(username)    // Recherche par nom d'utilisateur
User.findById(id)                // Recherche par ID
User.verifyPassword(plain, hash) // Vérifier le mot de passe
User.create(username, pwd, role) // Créer un utilisateur
```

**Exemple** :
```javascript
static async findByUsername(username) {
    const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
    );
    return result.rows[0];
}
```

**Sécurité** :
- Utilise des **requêtes paramétrées** (`$1`, `$2`) pour éviter les injections SQL
- Les mots de passe sont **hashés avec bcrypt** (salt de 10 rounds)

### `models/activity.js` - Modèle Activity

**Méthodes** :

```javascript
Activity.create(activityData)              // Créer une activité
Activity.findAll(filters)                  // Récupérer avec filtres optionnels
Activity.findById(id)                      // Récupérer par ID
Activity.update(id, activityData)          // Mettre à jour
Activity.delete(id)                        // Supprimer
Activity.getDistinctPointsVente()          // Liste des points de vente uniques
Activity.getDistinctResponsables()         // Liste des responsables uniques
```

**Filtres dynamiques** :
```javascript
static async findAll(filters = {}) {
    const { dateDebut, dateFin, pointVente } = filters;
    let query = 'SELECT * FROM activities WHERE 1=1';
    const params = [];
    
    if (dateDebut) {
        query += ` AND date >= $${params.length + 1}`;
        params.push(dateDebut);
    }
    // ...
    query += ' ORDER BY date DESC, created_at DESC';
    return await pool.query(query, params);
}
```

---

## 🛡️ Middleware

Les middlewares sont des fonctions qui interceptent les requêtes avant qu'elles n'atteignent les routes.

### `middleware/auth.js` - Authentification JWT

**Rôle** : Vérifier le token JWT dans les requêtes.

```javascript
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    
    if (!token) {
        return res.status(401).json({ error: 'Token requis' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user; // Injecter les infos user dans req
        next();
    });
};
```

**Flow** :
1. Extraire le token du header `Authorization: Bearer <token>`
2. Vérifier la signature avec `JWT_SECRET`
3. Si valide → ajouter `req.user` et appeler `next()`
4. Si invalide → retourner 401/403

**Utilisation** :
```javascript
router.get('/api/activities', authenticateToken, async (req, res) => {
    // req.user est disponible ici
});
```

### `middleware/roleCheck.js` - Vérification des rôles

**Rôle** : Vérifier que l'utilisateur a le bon rôle.

```javascript
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        next();
    };
};
```

**Utilisation** :
```javascript
// Seuls les ADMIN peuvent supprimer
router.delete('/api/activities/:id', 
    authenticateToken, 
    checkRole('ADMIN'), 
    async (req, res) => {
        // ...
    }
);
```

---

## 🛣️ Routes API

### `routes/auth.js` - Authentification

**Endpoints** :

#### POST `/api/auth/login`

**Body** :
```json
{
    "username": "DIDI",
    "password": "didi2024"
}
```

**Réponse** :
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": 1,
        "username": "DIDI",
        "role": "MANAGER"
    }
}
```

**Flow** :
1. Valider username/password
2. Chercher l'utilisateur dans la DB
3. Vérifier le mot de passe avec bcrypt
4. Créer un token JWT signé
5. Retourner le token et les infos user

### `routes/activities.js` - Gestion des activités

**Endpoints** :

#### GET `/api/activities`

**Query params** (tous optionnels) :
- `dateDebut` : YYYY-MM-DD
- `dateFin` : YYYY-MM-DD
- `pointVente` : string

**Exemples** :
```
GET /api/activities                                    → Toutes les activités
GET /api/activities?dateDebut=2025-10-01              → Depuis une date
GET /api/activities?dateDebut=2025-10-01&dateFin=2025-10-31  → Entre deux dates
GET /api/activities?pointVente=O.Foire                → Par point de vente
```

**Middleware** : `authenticateToken`

---

#### POST `/api/activities`

**Body** :
```json
{
    "date": "2025-10-22",
    "point_vente": "O.Foire",
    "responsable": "Aida",
    "note_ventes": "8,5",
    "plaintes_client": "Service lent",
    "produits_manquants": "Coca",
    "commentaire_livreurs": "Livraison OK",
    "commentaire": "RAS"
}
```

**Validation** :
- Champs requis : `date`, `point_vente`, `responsable`
- Note : regex `^([1-9]|10)([,.][0-9]+)?$` (accepte virgule ET point)

**Middleware** : `authenticateToken`

---

#### PUT `/api/activities/:id`

**Règles métier** :
- **MANAGER** : peut modifier uniquement ses propres activités **< 24h**
- **ADMIN** : peut modifier toutes les activités sans limite

**Vérification du délai 24h** :
```javascript
const createdAt = new Date(activity.created_at);
const now = new Date();
const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

if (hoursDiff > 24) {
    return res.status(403).json({ error: 'Délai de 24h dépassé' });
}
```

**Middleware** : `authenticateToken`

---

#### DELETE `/api/activities/:id`

**Restriction** : **ADMIN uniquement**

**Middleware** : `authenticateToken`, `checkRole('ADMIN')`

---

#### GET `/api/activities/meta/points-vente`

Retourne la liste des points de vente uniques dans la DB.

**Réponse** :
```json
["O.Foire", "Mbao", "Keur Massar", "Sacre Coeur"]
```

---

#### GET `/api/activities/meta/responsables`

Retourne la liste des responsables uniques dans la DB.

**Réponse** :
```json
["Aida", "Coura", "Fatou", ...]
```

---

## 🎨 Frontend

### Structure

```
public/
├── index.html           # Page principale
├── css/
│   └── style.css       # Styles CSS
├── js/
│   ├── auth.js         # Gestion authentification client
│   └── app.js          # Logique métier principale
└── data/
    ├── points-vente.json    # Liste des points de vente
    └── responsables.json    # Liste des responsables
```

### `public/index.html` - Interface

**Structure** :
```html
<!-- Page de connexion -->
<div id="loginPage">
    <form id="loginForm">...</form>
</div>

<!-- Page principale (cachée par défaut) -->
<div id="mainPage" style="display: none;">
    <!-- Header avec user info -->
    <header>...</header>
    
    <!-- Formulaire de saisie (collapsible) -->
    <section class="card">
        <div class="card-header" onclick="toggleSection('formSection')">
            📝 Nouvelle Activité
        </div>
        <div class="card-body" id="formSection">
            <form id="activityForm">...</form>
        </div>
    </section>
    
    <!-- Historique (collapsible) -->
    <section class="card">
        <div class="card-header" onclick="toggleSection('historySection')">
            📋 Historique des Activités
        </div>
        <div class="card-body" id="historySection">
            <!-- Filtres -->
            <div class="filters">...</div>
            <!-- Tableau -->
            <table id="activitiesTable">...</table>
        </div>
    </section>
</div>
```

### `public/js/auth.js` - Authentification client

**Responsabilités** :
1. Gérer le formulaire de connexion
2. Stocker/récupérer le token JWT dans `localStorage`
3. Vérifier l'état d'authentification au chargement
4. Gérer la déconnexion

**API** :
```javascript
Auth.login(username, password)  // Connexion
Auth.logout()                   // Déconnexion
Auth.isAuthenticated()          // Vérifier si connecté
Auth.getToken()                 // Récupérer le token
Auth.getUser()                  // Récupérer l'utilisateur
```

**Flow de connexion** :
```javascript
async login(username, password) {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    // Stocker dans localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
}
```

**Stockage** :
- `localStorage.token` → JWT token
- `localStorage.user` → Infos utilisateur (JSON)

### `public/js/app.js` - Logique métier

**Objet principal** : `App`

**Méthodes** :

```javascript
App.init()                          // Initialisation
App.loadActivities(filters)         // Charger les activités
App.loadMetadata()                  // Charger les dropdowns
App.submitForm()                    // Soumettre le formulaire
App.editActivity(id)                // Éditer une activité
App.deleteActivity(id)              // Supprimer une activité
App.applyFilters()                  // Appliquer les filtres
App.clearFilters()                  // Effacer les filtres
App.toggleSection(sectionId)        // Collapse/expand section
App.apiRequest(url, method, body)   // Requête API avec token
```

**Requêtes API avec authentification** :
```javascript
async apiRequest(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}`  // Token JWT
        }
    };
    
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
        Auth.logout(); // Token expiré
    }
    
    return await response.json();
}
```

### `public/data/*.json` - Données statiques

**`points-vente.json`** :
```json
[
  "O.Foire",
  "Mbao",
  "Keur Massar",
  "Sacre Coeur"
]
```

**`responsables.json`** :
```json
[
  "Aida",
  "Coura",
  "Fatou",
  "Rokhaya",
  "Nadou",
  "Papi",
  "Madieye",
  "Mame Diarra"
]
```

**Chargement** :
```javascript
const response = await fetch('/data/points-vente.json');
const pointsVente = await response.json();
```

---

## 🔄 Flux de données

### 1. Connexion utilisateur

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Client  │                    │ Serveur │                    │    DB    │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/auth/login         │                              │
     │ { username, password }       │                              │
     ├─────────────────────────────>│                              │
     │                              │ SELECT * FROM users          │
     │                              │ WHERE username = $1          │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │                              │<─────────────────────────────┤
     │                              │ user data                    │
     │                              │                              │
     │                              │ bcrypt.compare(pwd, hash)    │
     │                              │ jwt.sign(payload, secret)    │
     │                              │                              │
     │<─────────────────────────────┤                              │
     │ { token, user }              │                              │
     │                              │                              │
     │ localStorage.setItem('token')│                              │
     │                              │                              │
```

### 2. Création d'activité

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Client  │                    │ Serveur │                    │    DB    │
└────┬────┘                    └────┬────┘                    └────┬─────┘
     │                              │                              │
     │ POST /api/activities         │                              │
     │ Authorization: Bearer <token>│                              │
     │ Body: { date, point_vente... }│                             │
     ├─────────────────────────────>│                              │
     │                              │ authenticateToken()          │
     │                              │ jwt.verify(token, secret)    │
     │                              │ → req.user = { id, role }    │
     │                              │                              │
     │                              │ validateNote()               │
     │                              │                              │
     │                              │ INSERT INTO activities       │
     │                              ├─────────────────────────────>│
     │                              │                              │
     │                              │<─────────────────────────────┤
     │                              │ new activity                 │
     │<─────────────────────────────┤                              │
     │ { id, date, point_vente... } │                              │
     │                              │                              │
```

### 3. Modification avec règles métier

```
┌─────────┐                    ┌─────────┐                    ┌──────────┐
│ Client  │                    │ Serveur │                    │    DB    │
│(MANAGER)│                    └────┬────┘                    └────┬─────┘
└────┬────┘                         │                              │
     │ PUT /api/activities/5         │                              │
     ├─────────────────────────────>│                              │
     │                              │ authenticateToken()          │
     │                              │ → req.user = { id: 1, MANAGER}│
     │                              │                              │
     │                              │ SELECT * FROM activities     │
     │                              │ WHERE id = 5                 │
     │                              ├─────────────────────────────>│
     │                              │<─────────────────────────────┤
     │                              │ activity { created_by: 1 }   │
     │                              │                              │
     │                              │ if (created_by !== req.user.id)│
     │                              │    → 403 Forbidden           │
     │                              │                              │
     │                              │ hoursDiff = (now - created_at)│
     │                              │ if (hoursDiff > 24)          │
     │                              │    → 403 Délai dépassé       │
     │                              │                              │
     │                              │ UPDATE activities            │
     │                              ├─────────────────────────────>│
     │<─────────────────────────────┤                              │
     │ { updated activity }         │                              │
```

---

## 🔒 Sécurité

### 1. Authentification JWT

**Avantages** :
- ✅ Stateless (pas de session serveur)
- ✅ Token contient les infos utilisateur (id, username, role)
- ✅ Signature cryptographique (impossible à modifier)

**Structure d'un JWT** :
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.  ← Header (algorithme)
eyJpZCI6MSwidXNlcm5hbWUiOiJESURJIn0.  ← Payload (données)
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV   ← Signature (HMAC SHA256)
```

**Expiration** :
- Durée : 24h (configurable via `JWT_EXPIRES_IN`)
- Si expiré → 403 Forbidden → déconnexion automatique

### 2. Hachage des mots de passe

**bcrypt** avec 10 rounds de salt :
```javascript
const hash = await bcrypt.hash(password, 10);
// $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa
```

**Vérification** :
```javascript
const isValid = await bcrypt.compare(plainPassword, hash);
```

### 3. Protection contre les injections SQL

**Requêtes paramétrées** :
```javascript
// ❌ DANGEREUX (injection SQL possible)
pool.query(`SELECT * FROM users WHERE username = '${username}'`);

// ✅ SÉCURISÉ (paramètres échappés automatiquement)
pool.query('SELECT * FROM users WHERE username = $1', [username]);
```

### 4. Échappement HTML côté client

```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

Protection contre XSS (Cross-Site Scripting).

### 5. CORS

```javascript
app.use(cors());
```

Autorise les requêtes depuis d'autres domaines (nécessaire pour le développement).

### 6. Variables d'environnement

- Secrets stockés dans `.env` (non commité dans git)
- `.gitignore` contient `.env`
- `.env.example` fourni comme template

---

## 📊 Diagrammes

### Diagramme de classes (simplifié)

```
┌─────────────────┐         ┌──────────────────┐
│      User       │         │    Activity      │
├─────────────────┤         ├──────────────────┤
│ - id            │         │ - id             │
│ - username      │    1    │ - date           │
│ - password_hash │────────<│ - point_vente    │
│ - role          │    n    │ - responsable    │
│ - created_at    │         │ - note_ventes    │
└─────────────────┘         │ - ...            │
                            │ - created_by     │
                            │ - created_at     │
                            │ - updated_at     │
                            └──────────────────┘
```

### Diagramme de séquence - Authentification

```
User      Browser      Server      Database
 │           │           │            │
 │  Login    │           │            │
 ├──────────>│           │            │
 │           │  POST     │            │
 │           ├──────────>│            │
 │           │           │  Query     │
 │           │           ├───────────>│
 │           │           │<───────────┤
 │           │           │  User      │
 │           │           │            │
 │           │           │  Verify    │
 │           │           │  bcrypt    │
 │           │           │            │
 │           │           │  Generate  │
 │           │           │  JWT       │
 │           │<──────────┤            │
 │           │  Token    │            │
 │<──────────┤           │            │
 │  Success  │  Store    │            │
 │           │  localStorage          │
```

---

## 🚀 Pour aller plus loin

### Améliorations possibles

1. **Backend** :
   - Ajouter des logs (Winston, Morgan)
   - Implémenter un rate limiting (express-rate-limit)
   - Ajouter des tests unitaires (Jest, Mocha)
   - Pagination pour les grandes listes d'activités
   - Export Excel/PDF des activités

2. **Frontend** :
   - Framework moderne (React, Vue, Angular)
   - State management (Redux, Vuex)
   - PWA (Progressive Web App)
   - Tests E2E (Cypress, Playwright)

3. **Base de données** :
   - Migrations (Knex.js, Sequelize)
   - Backup automatique
   - Réplication pour la haute disponibilité

4. **DevOps** :
   - Docker/Docker Compose
   - CI/CD (GitHub Actions, GitLab CI)
   - Monitoring (Prometheus, Grafana)
   - Logging centralisé (ELK Stack)

5. **Sécurité** :
   - HTTPS/SSL
   - Refresh tokens
   - 2FA (Two-Factor Authentication)
   - Rate limiting par IP
   - Helmet.js pour les headers de sécurité

---

## 📞 Contact & Support

Pour toute question sur l'architecture ou le code, consultez :
- README.md (guide d'installation)
- Code source (commentaires)
- Cette documentation

**Bonne lecture ! 🎉**
