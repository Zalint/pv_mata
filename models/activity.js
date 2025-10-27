const pool = require('../config/db');

class Activity {
    static async create(activityData) {
        const {
            date,
            point_vente,
            responsable,
            note_ventes,
            plaintes_client,
            produits_manquants,
            commentaire_livreurs,
            commentaire,
            created_by
        } = activityData;

        try {
            const result = await pool.query(
                `INSERT INTO activities 
                (date, point_vente, responsable, note_ventes, plaintes_client, 
                produits_manquants, commentaire_livreurs, commentaire, created_by) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
                RETURNING *`,
                [date, point_vente, responsable, note_ventes, plaintes_client, 
                 produits_manquants, commentaire_livreurs, commentaire, created_by]
            );
            const activity = result.rows[0];
            if (activity && activity.date instanceof Date) {
                activity.date = activity.date.toISOString().split('T')[0];
            }
            return activity;
        } catch (error) {
            throw new Error('Erreur lors de la création de l\'activité: ' + error.message);
        }
    }

    static async findAll(filters = {}) {
        const { dateDebut, dateFin, pointVente } = filters;
        let query = 'SELECT * FROM activities WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (dateDebut) {
            query += ` AND date >= $${paramIndex}`;
            params.push(dateDebut);
            paramIndex++;
        }

        if (dateFin) {
            query += ` AND date <= $${paramIndex}`;
            params.push(dateFin);
            paramIndex++;
        }

        if (pointVente) {
            query += ` AND point_vente = $${paramIndex}`;
            params.push(pointVente);
            paramIndex++;
        }

        query += ' ORDER BY date DESC, created_at DESC';

        try {
            const result = await pool.query(query, params);
            // Convertir les dates en format YYYY-MM-DD pour éviter les problèmes de timezone
            return result.rows.map(row => ({
                ...row,
                date: row.date instanceof Date 
                    ? row.date.toISOString().split('T')[0] 
                    : row.date
            }));
        } catch (error) {
            throw new Error('Erreur lors de la récupération des activités: ' + error.message);
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT * FROM activities WHERE id = $1',
                [id]
            );
            const activity = result.rows[0];
            if (activity && activity.date instanceof Date) {
                activity.date = activity.date.toISOString().split('T')[0];
            }
            return activity;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'activité: ' + error.message);
        }
    }

    static async update(id, activityData) {
        const {
            date,
            point_vente,
            responsable,
            note_ventes,
            plaintes_client,
            produits_manquants,
            commentaire_livreurs,
            commentaire
        } = activityData;

        try {
            const result = await pool.query(
                `UPDATE activities 
                SET date = $1, point_vente = $2, responsable = $3, note_ventes = $4, 
                    plaintes_client = $5, produits_manquants = $6, 
                    commentaire_livreurs = $7, commentaire = $8
                WHERE id = $9 
                RETURNING *`,
                [date, point_vente, responsable, note_ventes, plaintes_client, 
                 produits_manquants, commentaire_livreurs, commentaire, id]
            );
            const activity = result.rows[0];
            if (activity && activity.date instanceof Date) {
                activity.date = activity.date.toISOString().split('T')[0];
            }
            return activity;
        } catch (error) {
            throw new Error('Erreur lors de la mise à jour de l\'activité: ' + error.message);
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query(
                'DELETE FROM activities WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Erreur lors de la suppression de l\'activité: ' + error.message);
        }
    }

    static async getDistinctPointsVente() {
        try {
            const result = await pool.query(
                'SELECT DISTINCT point_vente FROM activities ORDER BY point_vente'
            );
            return result.rows.map(row => row.point_vente);
        } catch (error) {
            throw new Error('Erreur lors de la récupération des points de vente: ' + error.message);
        }
    }

    static async getDistinctResponsables() {
        try {
            const result = await pool.query(
                'SELECT DISTINCT responsable FROM activities ORDER BY responsable'
            );
            return result.rows.map(row => row.responsable);
        } catch (error) {
            throw new Error('Erreur lors de la récupération des responsables: ' + error.message);
        }
    }
}

module.exports = Activity;
