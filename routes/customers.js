const express = require('express');
const router = express.Router();
const Customer = require('../models/customer');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

// GET /api/customers/all - Récupérer tous les clients avec pagination
router.get('/all', authenticateToken, async (req, res) => {
    try {
        const { telephone, nom, point_vente, type_client, dateDebut, dateFin, page = 1, pageSize = 50 } = req.query;
        
        const filters = {};
        if (telephone) filters.telephone = telephone;
        if (nom) filters.nom_client = nom;
        if (point_vente) filters.point_vente = point_vente;
        if (type_client) filters.type_client = type_client;
        if (dateDebut) filters.dateDebut = dateDebut;
        if (dateFin) filters.dateFin = dateFin;

        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);

        const { customers, totalCount } = await Customer.findAllWithPagination(filters, offset, limit);
        const stats = await Customer.getStats(filters);

        res.json({
            customers,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: parseInt(page),
            pageSize: parseInt(pageSize),
            stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
    }
});

// GET /api/customers - Récupérer les clients avec filtres
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { activity_id, date, point_vente, type_client } = req.query;
        
        const filters = {};
        if (activity_id) filters.activity_id = activity_id;
        if (date) filters.date = date;
        if (point_vente) filters.point_vente = point_vente;
        if (type_client) filters.type_client = type_client;

        const customers = await Customer.findAll(filters);
        res.json(customers);
    } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients' });
    }
});

// GET /api/customers/stats - Statistiques des clients
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { activity_id, date, point_vente } = req.query;
        
        const filters = {};
        if (activity_id) filters.activity_id = activity_id;
        if (date) filters.date = date;
        if (point_vente) filters.point_vente = point_vente;

        const stats = await Customer.getStats(filters);
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors du calcul des statistiques:', error);
        res.status(500).json({ error: 'Erreur serveur lors du calcul des statistiques' });
    }
});

// GET /api/customers/check-phone - Vérifier si un téléphone existe
router.get('/check-phone', authenticateToken, async (req, res) => {
    try {
        const { telephone } = req.query;
        
        if (!telephone) {
            return res.status(400).json({ error: 'Le numéro de téléphone est requis' });
        }

        const result = await Customer.checkPhoneExists(telephone);
        res.json(result);
    } catch (error) {
        console.error('Erreur lors de la vérification du téléphone:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la vérification' });
    }
});

// GET /api/customers/:id - Récupérer un client par ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findById(id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }
        
        res.json(customer);
    } catch (error) {
        console.error('Erreur lors de la récupération du client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération du client' });
    }
});

// POST /api/customers - Créer un nouveau client
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            activity_id,
            date,
            telephone,
            nom_client,
            point_vente,
            montant_commande,
            type_client,
            comment_connu,
            commentaire_client,
            note_qualite_produits,
            note_niveau_prix,
            note_service_commercial
        } = req.body;

        // Validation des champs requis
        if (!date || !telephone || !nom_client || !point_vente || !montant_commande || !type_client) {
            return res.status(400).json({ 
                error: 'Les champs date, téléphone, nom, point de vente, montant et type client sont requis' 
            });
        }

        // Validation du type client
        if (!['Nouveau', 'Récurrent'].includes(type_client)) {
            return res.status(400).json({ 
                error: 'Le type client doit être "Nouveau" ou "Récurrent"' 
            });
        }

        // Validation des notes (si fournies)
        const validateNote = (note, name) => {
            if (note !== null && note !== undefined && (note < 0 || note > 10)) {
                throw new Error(`${name} doit être entre 0 et 10`);
            }
        };

        validateNote(note_qualite_produits, 'La note qualité');
        validateNote(note_niveau_prix, 'La note prix');
        validateNote(note_service_commercial, 'La note service');

        const customerData = {
            activity_id: activity_id || null,
            date,
            telephone,
            nom_client,
            point_vente,
            montant_commande: parseInt(montant_commande),
            type_client,
            comment_connu: comment_connu || null,
            commentaire_client: commentaire_client || null,
            note_qualite_produits: note_qualite_produits || null,
            note_niveau_prix: note_niveau_prix || null,
            note_service_commercial: note_service_commercial || null,
            created_by: req.user.id
        };

        const newCustomer = await Customer.create(customerData);
        res.status(201).json(newCustomer);
    } catch (error) {
        console.error('Erreur lors de la création du client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la création du client: ' + error.message });
    }
});

// PUT /api/customers/:id - Modifier un client
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date,
            telephone,
            nom_client,
            point_vente,
            montant_commande,
            type_client,
            comment_connu,
            commentaire_client,
            note_qualite_produits,
            note_niveau_prix,
            note_service_commercial
        } = req.body;

        // Vérifier que le client existe
        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        // Permissions: ADMIN et MANAGER peuvent modifier tous les clients
        if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
            return res.status(403).json({ 
                error: 'Vous n\'avez pas les permissions pour modifier ce client' 
            });
        }

        // Validation des champs requis
        if (!date || !telephone || !nom_client || !point_vente || !montant_commande || !type_client) {
            return res.status(400).json({ 
                error: 'Les champs date, téléphone, nom, point de vente, montant et type client sont requis' 
            });
        }

        // Validation des notes
        const validateNote = (note, name) => {
            if (note !== null && note !== undefined && (note < 0 || note > 10)) {
                throw new Error(`${name} doit être entre 0 et 10`);
            }
        };

        validateNote(note_qualite_produits, 'La note qualité');
        validateNote(note_niveau_prix, 'La note prix');
        validateNote(note_service_commercial, 'La note service');

        const customerData = {
            date,
            telephone,
            nom_client,
            point_vente,
            montant_commande: parseInt(montant_commande),
            type_client,
            comment_connu: comment_connu || null,
            commentaire_client: commentaire_client || null,
            note_qualite_produits: note_qualite_produits || null,
            note_niveau_prix: note_niveau_prix || null,
            note_service_commercial: note_service_commercial || null
        };

        const updatedCustomer = await Customer.update(id, customerData);
        res.json(updatedCustomer);
    } catch (error) {
        console.error('Erreur lors de la modification du client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la modification du client: ' + error.message });
    }
});

// DELETE /api/customers/:id - Supprimer un client (ADMIN toujours, MANAGER dans les 48h)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findById(id);
        if (!customer) {
            return res.status(404).json({ error: 'Client non trouvé' });
        }

        // Vérifier les permissions
        if (req.user.role === 'ADMIN') {
            // ADMIN peut toujours supprimer
        } else if (req.user.role === 'MANAGER') {
            // MANAGER peut supprimer uniquement dans les 48h
            const createdAt = new Date(customer.created_at);
            const now = new Date();
            const diffHours = (now - createdAt) / (1000 * 60 * 60);
            
            if (diffHours > 48) {
                return res.status(403).json({ 
                    error: 'Vous ne pouvez supprimer que les clients créés dans les 48 dernières heures' 
                });
            }
        } else {
            return res.status(403).json({ 
                error: 'Vous n\'avez pas les permissions pour supprimer ce client' 
            });
        }

        await Customer.delete(id);
        res.json({ message: 'Client supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du client:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la suppression du client' });
    }
});

module.exports = router;
