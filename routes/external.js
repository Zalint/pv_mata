const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const authenticateApiKey = require('../middleware/apiKeyAuth');

// Fonction pour valider le format de date (YYYY-MM-DD)
const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

// Fonction pour formater une date au format YYYY-MM-DD
const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// GET /api/external/point-vente/status - Récupérer le statut des points de vente
router.get('/point-vente/status', authenticateApiKey, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let activities;
        let usedStartDate, usedEndDate;

        // Si pas de dates, récupérer la dernière date disponible
        if (!start_date && !end_date) {
            // Récupérer toutes les activités pour trouver la dernière date
            const allActivities = await Activity.findAll({});
            
            if (allActivities.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Aucune activité trouvée dans la base de données'
                });
            }

            // Trouver la date la plus récente
            const latestDate = allActivities.reduce((latest, activity) => {
                const activityDate = new Date(activity.date);
                return activityDate > latest ? activityDate : latest;
            }, new Date(allActivities[0].date));

            usedStartDate = usedEndDate = formatDate(latestDate);
            
            // Filtrer les activités pour cette date
            activities = allActivities.filter(activity => 
                formatDate(activity.date) === usedStartDate
            );
        } else {
            // Validation des paramètres requis
            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Les paramètres start_date et end_date doivent être tous les deux présents ou absents (format: YYYY-MM-DD)'
                });
            }

            // Validation du format des dates
            if (!isValidDate(start_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'start_date doit être au format YYYY-MM-DD'
                });
            }

            if (!isValidDate(end_date)) {
                return res.status(400).json({
                    success: false,
                    error: 'end_date doit être au format YYYY-MM-DD'
                });
            }

            // Validation de la cohérence des dates
            const startDate = new Date(start_date);
            const endDate = new Date(end_date);

            if (startDate > endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'start_date ne peut pas être postérieure à end_date'
                });
            }

            // Validation de la plage maximale (optionnel - 90 jours)
            const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);
            if (daysDiff > 90) {
                return res.status(400).json({
                    success: false,
                    error: 'La plage de dates ne peut pas dépasser 90 jours'
                });
            }

            usedStartDate = start_date;
            usedEndDate = end_date;

            // Récupération des activités
            activities = await Activity.findAll({
                dateDebut: start_date,
                dateFin: end_date
            });
        }

        // Grouper les activités par date
        const groupedData = {};
        
        activities.forEach(activity => {
            const dateKey = formatDate(activity.date);
            
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = [];
            }
            
            groupedData[dateKey].push({
                point_de_vente: activity.point_vente,
                responsable: activity.responsable,
                note: activity.note_ventes,
                plaintes: activity.plaintes_client || 'neant',
                produits_manquants: activity.produits_manquants || 'neant',
                commentaire_livreurs: activity.commentaire_livreurs || 'neant',
                commentaires: activity.commentaire || 'neant'
            });
        });

        // Trier les dates
        const sortedData = {};
        Object.keys(groupedData)
            .sort((a, b) => new Date(b) - new Date(a)) // Du plus récent au plus ancien
            .forEach(key => {
                sortedData[key] = groupedData[key];
            });

        // Construire la réponse
        const response = {
            success: true,
            data: sortedData,
            count: activities.length,
            period: {
                start: usedStartDate,
                end: usedEndDate
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Erreur lors de la récupération du statut des points de vente:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des données'
        });
    }
});

module.exports = router;
