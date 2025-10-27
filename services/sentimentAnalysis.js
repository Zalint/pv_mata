const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyse le sentiment et génère un résumé pour une journée d'activités
 * @param {Array} activities - Liste des activités d'une date
 * @param {String} date - Date au format YYYY-MM-DD
 * @returns {Object} - Résultat de l'analyse avec sentiment et interprétation
 */
async function analyzeDaySentiment(activities, date) {
    if (!activities || activities.length === 0) {
        return {
            date,
            sentiment: 'neutral',
            summary: 'Aucune activité enregistrée pour cette date.',
            key_points: [],
            recommendations: []
        };
    }

    // Construire le contexte pour le LLM
    const context = activities.map((activity, index) => {
        return `
Point de vente ${index + 1}: ${activity.point_de_vente}
- Responsable: ${activity.responsable}
- Note: ${activity.note || 'Non renseignée'}
- Plaintes clients: ${activity.plaintes}
- Produits manquants: ${activity.produits_manquants}
- Commentaires livreurs: ${activity.commentaire_livreurs}
- Commentaires généraux: ${activity.commentaires}
`;
    }).join('\n---\n');

    const prompt = `Tu es un analyste expert en gestion de points de vente. Analyse les données suivantes pour la date du ${date} et fournis une évaluation détaillée.

DONNÉES DES POINTS DE VENTE:
${context}

Fournis une analyse structurée au format JSON avec:
1. "sentiment": Une évaluation globale ("positif", "neutre", "négatif", "mixte")
2. "score": Un score global sur 10 basé sur les notes et la situation générale
3. "summary": Un résumé en 2-3 phrases de la journée
4. "key_points": Un tableau de 3-5 points clés (positifs et négatifs)
5. "issues": Un tableau listant les problèmes principaux identifiés
6. "recommendations": Un tableau de 2-4 recommandations concrètes pour améliorer la situation

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Tu es un expert en analyse de données de points de vente. Tu réponds toujours en JSON valide, en français.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });

        const content = response.choices[0].message.content.trim();
        
        // Extraire le JSON si entouré de markdown
        let jsonContent = content;
        if (content.startsWith('```')) {
            jsonContent = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        }
        
        const analysis = JSON.parse(jsonContent);
        
        return {
            date,
            ...analysis,
            total_points_vente: activities.length,
            analyzed_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('Erreur lors de l\'analyse de sentiment:', error);
        
        // Fallback en cas d'erreur
        return {
            date,
            sentiment: 'unknown',
            score: null,
            summary: 'Erreur lors de l\'analyse automatique.',
            key_points: ['Analyse non disponible'],
            issues: [],
            recommendations: ['Vérifier la configuration de l\'API OpenAI'],
            error: error.message,
            total_points_vente: activities.length
        };
    }
}

/**
 * Analyse le sentiment des commentaires clients pour un point de vente spécifique
 * @param {String} pointVente - Nom du point de vente
 * @param {Array} comments - Liste de tous les commentaires du point de vente
 * @returns {Object} - Résultat de l'analyse de sentiment
 */
async function analyzePointVenteSentiment(pointVente, comments) {
    if (!comments || comments.length === 0) {
        return {
            sentiment: 'neutral',
            score: null,
            summary: 'Aucun commentaire disponible',
            analyzed: false
        };
    }

    // Filtrer les commentaires vides ou "neant"
    const validComments = comments.filter(c => 
        c && c.toLowerCase() !== 'neant' && c.trim() !== ''
    );

    if (validComments.length === 0) {
        return {
            sentiment: 'neutral',
            score: null,
            summary: 'Aucun commentaire significatif',
            analyzed: false
        };
    }

    const commentsText = validComments.map((c, i) => `${i + 1}. ${c}`).join('\n');

    // Déterminer si ce sont des commentaires clients ou des observations de responsables
    const isClientComments = pointVente.includes('Commentaires clients');
    
    let prompt;
    if (isClientComments) {
        prompt = `Tu es un analyste expert en satisfaction client. Analyse les commentaires clients suivants pour le point de vente "${pointVente.replace(' - Commentaires clients', '')}":

COMMENTAIRES CLIENTS:
${commentsText}

Fournis une analyse au format JSON avec:
1. "sentiment": Évaluation globale ("positif", "neutre", "négatif", "mixte")
2. "score": Score de satisfaction sur 10 (basé sur le ton et le contenu des commentaires)
3. "summary": Résumé concis en 1-2 phrases de la perception des clients
4. "main_concerns": Tableau des principales préoccupations mentionnées par les clients (max 3)
5. "positive_aspects": Tableau des aspects positifs mentionnés par les clients (max 3)

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
    } else {
        prompt = `Tu es un analyste expert en gestion opérationnelle. Analyse les observations et commentaires suivants du responsable du point de vente "${pointVente}":

OBSERVATIONS DU RESPONSABLE:
${commentsText}

Ces commentaires proviennent du ressenti du responsable/commercial sur l'activité du jour (plaintes observées, produits manquants, commentaires sur les livreurs, etc.).

Fournis une analyse au format JSON avec:
1. "sentiment": Évaluation globale de la situation opérationnelle ("positif", "neutre", "négatif", "mixte")
2. "score": Score sur 10 reflétant la qualité de l'opération du jour
3. "summary": Résumé concis en 1-2 phrases de la situation opérationnelle du point de vente
4. "main_concerns": Tableau des principaux problèmes opérationnels identifiés (max 3)
5. "positive_aspects": Tableau des aspects opérationnels positifs (max 3)

IMPORTANT: 
- Ne pas utiliser "Les clients expriment" ou "Les clients disent". Utilise plutôt "Le responsable signale", "Des problèmes opérationnels incluent", "La situation opérationnelle montre", etc.
- Quand tu mentionnes des produits manquants, TOUJOURS préciser les noms exacts des produits (ex: "merguez agneau" au lieu de "un produit manquant")
- Quand tu mentionnes des plaintes, TOUJOURS être spécifique sur la nature exacte de la plainte

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;
    }

    try {
        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Tu es un expert en analyse de satisfaction client. Tu réponds toujours en JSON valide, en français.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        const content = response.choices[0].message.content.trim();
        
        // Extraire le JSON si entouré de markdown
        let jsonContent = content;
        if (content.startsWith('```')) {
            jsonContent = content.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
        }
        
        const analysis = JSON.parse(jsonContent);
        
        return {
            ...analysis,
            total_comments: validComments.length,
            analyzed: true
        };

    } catch (error) {
        console.error(`Erreur lors de l'analyse de sentiment pour ${pointVente}:`, error);
        
        return {
            sentiment: 'unknown',
            score: null,
            summary: 'Erreur lors de l\'analyse automatique',
            main_concerns: [],
            positive_aspects: [],
            error: error.message,
            analyzed: false
        };
    }
}

module.exports = {
    analyzeDaySentiment,
    analyzePointVenteSentiment
};
