# API Externe - Documentation

## Endpoint: Statut des Points de Vente

### URL
```
GET /api/external/point-vente/status
```

### Authentification
L'API utilise une authentification par clé API via le header `x-api-key`.

**Header requis:**
```
x-api-key: votre_cle_api
```

### Paramètres de requête

| Paramètre | Type | Requis | Description |
|-----------|------|---------|-------------|
| start_date | string | Oui | Date de début au format YYYY-MM-DD |
| end_date | string | Oui | Date de fin au format YYYY-MM-DD |

**Contraintes:**
- `start_date` ne peut pas être postérieure à `end_date`
- La plage maximale est de 90 jours
- Format de date strictement YYYY-MM-DD

### Exemple de requête

```bash
curl -X GET "http://localhost:3000/api/external/point-vente/status?start_date=2025-10-24&end_date=2025-10-25" \
  -H "x-api-key: votre_cle_api"
```

### Réponse réussie (200 OK)

```json
{
  "success": true,
  "data": {
    "2025-10-25": [
      {
        "point_de_vente": "Sacre Coeur",
        "responsable": "Fatou",
        "note": null,
        "plaintes": "agneau est venu en retard",
        "produits_manquants": "neant",
        "commentaire_livreurs": "neant",
        "commentaires": "neant"
      },
      {
        "point_de_vente": "Mbao",
        "responsable": "Coura",
        "note": null,
        "plaintes": "viande de mouton est fini trop top",
        "produits_manquants": "merguez agneau",
        "commentaire_livreurs": "neant",
        "commentaires": "rien à signaler"
      }
    ],
    "2025-10-24": [
      {
        "point_de_vente": "Mbao",
        "responsable": "Papi",
        "note": null,
        "plaintes": "Ras",
        "produits_manquants": "Oeuf",
        "commentaire_livreurs": "Neant",
        "commentaires": "Aucun commentaire"
      }
    ]
  },
  "count": 7,
  "period": {
    "start": "2025-10-24",
    "end": "2025-10-25"
  }
}
```

### Structure de la réponse

| Champ | Type | Description |
|-------|------|-------------|
| success | boolean | Indique si la requête a réussi |
| data | object | Objet avec les dates comme clés (YYYY-MM-DD) |
| data[date] | array | Liste des activités pour cette date |
| count | number | Nombre total d'activités retournées |
| period.start | string | Date de début de la période |
| period.end | string | Date de fin de la période |

### Structure d'une activité

| Champ | Type | Description |
|-------|------|-------------|
| point_de_vente | string | Nom du point de vente |
| responsable | string | Nom du responsable |
| note | number\|null | Note des ventes (1-10) |
| plaintes | string | Plaintes des clients |
| produits_manquants | string | Produits manquants |
| commentaire_livreurs | string | Commentaires des livreurs |
| commentaires | string | Commentaires généraux |

### Codes d'erreur

#### 400 Bad Request
Paramètres invalides ou manquants.

```json
{
  "success": false,
  "error": "Les paramètres start_date et end_date sont requis (format: YYYY-MM-DD)"
}
```

**Cas possibles:**
- Paramètres manquants
- Format de date invalide
- start_date > end_date
- Plage de dates > 90 jours

#### 401 Unauthorized
API key manquante ou invalide.

```json
{
  "success": false,
  "error": "API key manquante. Veuillez fournir un x-api-key dans les headers."
}
```

ou

```json
{
  "success": false,
  "error": "API key invalide."
}
```

#### 500 Internal Server Error
Erreur serveur.

```json
{
  "success": false,
  "error": "Erreur serveur lors de la récupération des données"
}
```

## Configuration

### Fichier .env

Ajoutez la clé API dans votre fichier `.env`:

```env
EXTERNAL_API_KEY=votre_cle_secrete_ici
```

**Important:** Changez la valeur par défaut et utilisez une clé sécurisée en production.

### Génération d'une clé API sécurisée

```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Exemples d'utilisation

### JavaScript (fetch)

```javascript
const apiKey = 'votre_cle_api';
const startDate = '2025-10-24';
const endDate = '2025-10-25';

fetch(`http://localhost:3000/api/external/point-vente/status?start_date=${startDate}&end_date=${endDate}`, {
  method: 'GET',
  headers: {
    'x-api-key': apiKey
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
    // Accéder aux données d'une date spécifique
    const activites2025_10_25 = data.data['2025-10-25'];
  })
  .catch(error => console.error('Error:', error));
```

### Python (requests)

```python
import requests

api_key = 'votre_cle_api'
url = 'http://localhost:3000/api/external/point-vente/status'
headers = {'x-api-key': api_key}
params = {
    'start_date': '2025-10-24',
    'end_date': '2025-10-25'
}

response = requests.get(url, headers=headers, params=params)
data = response.json()

if data['success']:
    # Accéder aux données d'une date spécifique
    activites = data['data']['2025-10-25']
    print(f"Nombre total d'activités: {data['count']}")
```

### cURL

```bash
# Requête basique
curl -X GET "http://localhost:3000/api/external/point-vente/status?start_date=2025-10-24&end_date=2025-10-25" \
  -H "x-api-key: votre_cle_api"

# Avec formatage JSON (jq)
curl -X GET "http://localhost:3000/api/external/point-vente/status?start_date=2025-10-24&end_date=2025-10-25" \
  -H "x-api-key: votre_cle_api" | jq
```

## Notes

- Les données sont groupées par date (clé au format YYYY-MM-DD)
- Les dates sont triées du plus récent au plus ancien
- Les valeurs vides sont remplacées par "neant"
- La note peut être `null` si non renseignée
