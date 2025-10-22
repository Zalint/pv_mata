const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// Fonction de validation de la note (accepte virgules ET points)
const validateNote = (note) => {
    if (!note) return true; // Optionnel
    const regex = /^([1-9]|10)([,.][0-9]+)?$/;
    return regex.test(note);
};

// GET /api/activities/meta/points-vente - Liste des points de vente (AVANT les routes avec :id)
router.get('/meta/points-vente', authenticateToken, async (req, res) => {
    try {
        const pointsVente = await Activity.getDistinctPointsVente();
        res.json(pointsVente);
    } catch (error) {
        console.error('Erreur lors de la récupération des points de vente:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/activities/meta/responsables - Liste des responsables (AVANT les routes avec :id)
router.get('/meta/responsables', authenticateToken, async (req, res) => {
    try {
        const responsables = await Activity.getDistinctResponsables();
        res.json(responsables);
    } catch (error) {
        console.error('Erreur lors de la récupération des responsables:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/activities - Récupérer les activités avec filtres optionnels
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { dateDebut, dateFin, pointVente } = req.query;
        
        console.log('Filtres reçus:', { dateDebut, dateFin, pointVente });
        
        const filters = {};
        if (dateDebut) filters.dateDebut = dateDebut;
        if (dateFin) filters.dateFin = dateFin;
        if (pointVente) filters.pointVente = pointVente;

        const activities = await Activity.findAll(filters);
        console.log(`${activities.length} activités trouvées`);
        res.json(activities);
    } catch (error) {
        console.error('Erreur lors de la récupération des activités:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des activités' });
    }
});

// GET /api/activities/:id - Récupérer une activité par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const activity = await Activity.findById(id);
        
        if (!activity) {
            return res.status(404).json({ error: 'Activité non trouvée' });
        }
        
        res.json(activity);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'activité:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'activité' });
    }
});

// POST /api/activities - Créer une nouvelle activité
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            date,
            point_vente,
            responsable,
            note_ventes,
            plaintes_client,
            produits_manquants,
            commentaire_livreurs,
            commentaire
        } = req.body;

        // Validation des champs requis
        if (!date || !point_vente || !responsable) {
            return res.status(400).json({ 
                error: 'Les champs date, point_vente et responsable sont requis' 
            });
        }

        // Validation de la note
        if (note_ventes && !validateNote(note_ventes)) {
            return res.status(400).json({ 
                error: 'La note doit être entre 1 et 10 (virgule ou point accepté, ex: 8,5 ou 8.5)' 
            });
        }

        const activityData = {
            date,
            point_vente,
            responsable,
            note_ventes: note_ventes || null,
            plaintes_client: plaintes_client || '',
            produits_manquants: produits_manquants || '',
            commentaire_livreurs: commentaire_livreurs || '',
            commentaire: commentaire || '',
            created_by: req.user.id
        };

        const newActivity = await Activity.create(activityData);
        res.status(201).json(newActivity);
    } catch (error) {
        console.error('Erreur lors de la création de l\'activité:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création de l\'activité' });
    }
});

// PUT /api/activities/:id - Modifier une activité
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date,
            point_vente,
            responsable,
            note_ventes,
            plaintes_client,
            produits_manquants,
            commentaire_livreurs,
            commentaire
        } = req.body;

        // Récupérer l'activité existante
        const activity = await Activity.findById(id);
        if (!activity) {
            return res.status(404).json({ error: 'Activité non trouvée' });
        }

        // Vérification des permissions
        if (req.user.role === 'MANAGER') {
            // Manager peut modifier uniquement ses propres activités
            if (activity.created_by !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Vous ne pouvez modifier que vos propres activités' 
                });
            }

            // Vérification du délai de 24h
            const createdAt = new Date(activity.created_at);
            const now = new Date();
            const hoursDiff = (now - createdAt) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                return res.status(403).json({ 
                    error: 'Vous ne pouvez plus modifier cette activité (délai de 24h dépassé)' 
                });
            }
        }
        // ADMIN peut tout modifier sans restriction

        // Validation des champs requis
        if (!date || !point_vente || !responsable) {
            return res.status(400).json({ 
                error: 'Les champs date, point_vente et responsable sont requis' 
            });
        }

        // Validation de la note
        if (note_ventes && !validateNote(note_ventes)) {
            return res.status(400).json({ 
                error: 'La note doit être entre 1 et 10 (virgule ou point accepté, ex: 8,5 ou 8.5)' 
            });
        }

        const activityData = {
            date,
            point_vente,
            responsable,
            note_ventes: note_ventes || null,
            plaintes_client: plaintes_client || '',
            produits_manquants: produits_manquants || '',
            commentaire_livreurs: commentaire_livreurs || '',
            commentaire: commentaire || ''
        };

        const updatedActivity = await Activity.update(id, activityData);
        res.json(updatedActivity);
    } catch (error) {
        console.error('Erreur lors de la modification de l\'activité:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la modification de l\'activité' });
    }
});

// DELETE /api/activities/:id - Supprimer une activité (ADMIN uniquement)
router.delete('/:id', authenticateToken, checkRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await Activity.findById(id);
        if (!activity) {
            return res.status(404).json({ error: 'Activité non trouvée' });
        }

        await Activity.delete(id);
        res.json({ message: 'Activité supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'activité:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression de l\'activité' });
    }
});

module.exports = router;
