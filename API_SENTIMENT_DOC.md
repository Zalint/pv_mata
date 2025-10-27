# API Analyse de Sentiment - Documentation

## Endpoint: Analyse de sentiment des points de vente

### URL
```
GET /api/external/point-vente/sentiment
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
| date | string | Non | Date à analyser au format YYYY-MM-DD. Si absent, analyse la dernière date disponible |

### Exemple de requête

**Avec une date spécifique:**
```bash
curl -X GET "http://localhost:3000/api/external/point-vente/sentiment?date=2025-10-22" \
  -H "x-api-key: votre_cle_api"
```

**Sans date (dernière date disponible):**
```bash
curl -X GET "http://localhost:3000/api/external/point-vente/sentiment" \
  -H "x-api-key: votre_cle_api"
```

### Réponse réussie (200 OK)

```json
{
  "success": true,
  "analysis": {
    "date": "2025-10-22",
    "sentiment": "mixte",
    "score": 8.5,
    "summary": "Journée globalement positive avec d'excellentes performances à Sacre Coeur et Keur Massar (notes 10/10). Quelques problèmes de stock identifiés, notamment le manque de Yell et d'œufs.",
    "key_points": [
      "Excellentes notes de 10/10 pour Sacre Coeur et Keur Massar",
      "Livraisons ponctuelles et bien coordonnées",
      "Manque de produits stratégiques (Yell, œufs)",
      "Plainte concernant les prix de la viande hachée et merguez",
      "Faible affluence à Mbao"
    ],
    "issues": [
      "Rupture de stock : Yell (Keur Massar), Œufs (Mbao)",
      "Prix jugés trop élevés pour viande hachée et merguez (O.Foire)",
      "Problèmes SAV : clients ne reçoivent plus d'appels (Mbao)",
      "Faible activité à Mbao"
    ],
    "recommendations": [
      "Améliorer la gestion des stocks pour éviter les ruptures de produits essentiels",
      "Revoir la stratégie tarifaire sur la viande hachée et les merguez",
      "Renforcer le suivi SAV pour assurer un contact régulier avec les clients",
      "Analyser les causes de la faible affluence à Mbao et mettre en place des actions marketing"
    ],
    "total_points_vente": 4,
    "analyzed_at": "2025-10-27T12:30:00.000Z"
  }
}
```

### Structure de la réponse

| Champ | Type | Description |
|-------|------|-------------|
| success | boolean | Indique si la requête a réussi |
| analysis | object | Objet contenant l'analyse complète |
| analysis.date | string | Date analysée (YYYY-MM-DD) |
| analysis.sentiment | string | Sentiment global ("positif", "neutre", "négatif", "mixte") |
| analysis.score | number | Score global sur 10 |
| analysis.summary | string | Résumé de la journée en 2-3 phrases |
| analysis.key_points | array | Liste de 3-5 points clés (positifs et négatifs) |
| analysis.issues | array | Liste des problèmes identifiés |
| analysis.recommendations | array | Liste de 2-4 recommandations concrètes |
| analysis.total_points_vente | number | Nombre de points de vente analysés |
| analysis.analyzed_at | string | Timestamp ISO de l'analyse |

### Codes d'erreur

#### 400 Bad Request
Format de date invalide.

```json
{
  "success": false,
  "error": "date doit être au format YYYY-MM-DD"
}
```

#### 401 Unauthorized
API key manquante ou invalide.

```json
{
  "success": false,
  "error": "API key invalide."
}
```

#### 404 Not Found
Aucune activité trouvée pour la date spécifiée.

```json
{
  "success": false,
  "error": "Aucune activité trouvée pour la date 2025-10-23"
}
```

#### 500 Internal Server Error
Erreur serveur ou problème avec l'API OpenAI.

```json
{
  "success": false,
  "error": "Erreur serveur lors de l'analyse de sentiment",
  "details": "Message d'erreur détaillé"
}
```

## Configuration

### Fichier .env

Ajoutez les clés nécessaires dans votre fichier `.env`:

```env
# External API Key
EXTERNAL_API_KEY=votre_cle_secrete_ici

# OpenAI API Key (pour l'analyse de sentiment)
OPENAI_API_KEY=sk-votre_cle_openai
```

### Obtenir une clé OpenAI

1. Créez un compte sur https://platform.openai.com
2. Allez dans **API Keys** : https://platform.openai.com/api-keys
3. Créez une nouvelle clé secrète
4. Copiez la clé dans votre fichier `.env`

**Note:** L'API utilise le modèle `gpt-4o-mini` qui est optimisé pour le coût/performance.

## Exemples d'utilisation

### JavaScript (fetch)

```javascript
const apiKey = 'votre_cle_api';
const date = '2025-10-22'; // Optionnel

const url = date 
  ? `http://localhost:3000/api/external/point-vente/sentiment?date=${date}`
  : `http://localhost:3000/api/external/point-vente/sentiment`;

fetch(url, {
  method: 'GET',
  headers: {
    'x-api-key': apiKey
  }
})
  .then(response => response.json())
  .then(data => {
    console.log('Sentiment:', data.analysis.sentiment);
    console.log('Score:', data.analysis.score);
    console.log('Summary:', data.analysis.summary);
    console.log('Recommendations:', data.analysis.recommendations);
  })
  .catch(error => console.error('Error:', error));
```

### Python (requests)

```python
import requests

api_key = 'votre_cle_api'
url = 'http://localhost:3000/api/external/point-vente/sentiment'
headers = {'x-api-key': api_key}
params = {'date': '2025-10-22'}  # Optionnel

response = requests.get(url, headers=headers, params=params)
data = response.json()

if data['success']:
    analysis = data['analysis']
    print(f"Sentiment: {analysis['sentiment']}")
    print(f"Score: {analysis['score']}/10")
    print(f"\nRésumé: {analysis['summary']}")
    print(f"\nProblèmes identifiés:")
    for issue in analysis['issues']:
        print(f"  - {issue}")
    print(f"\nRecommandations:")
    for rec in analysis['recommendations']:
        print(f"  - {rec}")
```

### cURL

```bash
# Analyse de la dernière date
curl -X GET "http://localhost:3000/api/external/point-vente/sentiment" \
  -H "x-api-key: votre_cle_api"

# Analyse d'une date spécifique
curl -X GET "http://localhost:3000/api/external/point-vente/sentiment?date=2025-10-22" \
  -H "x-api-key: votre_cle_api"

# Avec formatage JSON (jq)
curl -X GET "http://localhost:3000/api/external/point-vente/sentiment?date=2025-10-22" \
  -H "x-api-key: votre_cle_api" | jq
```

## Cas d'usage

### Dashboard de monitoring
Intégrez l'analyse de sentiment dans un dashboard pour avoir une vue d'ensemble quotidienne.

### Alertes automatiques
Configurez des alertes lorsque le sentiment est "négatif" ou le score < 6.

### Rapports hebdomadaires
Agrégez les analyses quotidiennes pour générer des rapports hebdomadaires.

### Prédiction de tendances
Utilisez l'historique des analyses pour identifier des patterns et anticiper les problèmes.

## Notes techniques

- **Modèle utilisé**: GPT-4o-mini (optimisé coût/performance)
- **Température**: 0.3 (réponses cohérentes et déterministes)
- **Max tokens**: 1000
- **Langue**: Français
- **Format de sortie**: JSON structuré

## Limites

- Nécessite une clé API OpenAI valide avec crédit disponible
- Coût par requête : ~$0.0001-0.0003 (variable selon la longueur)
- Temps de réponse : 2-5 secondes selon la charge OpenAI
- Analyse basée uniquement sur les données textuelles fournies
