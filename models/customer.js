const pool = require('../config/db');

class Customer {
    static async create(customerData) {
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
            note_service_commercial,
            created_by
        } = customerData;

        try {
            const result = await pool.query(
                `INSERT INTO customers 
                (activity_id, date, telephone, nom_client, point_vente, montant_commande, 
                type_client, comment_connu, commentaire_client, note_qualite_produits, 
                note_niveau_prix, note_service_commercial, created_by) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
                RETURNING *`,
                [activity_id, date, telephone, nom_client, point_vente, montant_commande,
                 type_client, comment_connu, commentaire_client, note_qualite_produits,
                 note_niveau_prix, note_service_commercial, created_by]
            );
            const customer = result.rows[0];
            if (customer && customer.date instanceof Date) {
                customer.date = customer.date.toISOString().split('T')[0];
            }
            return customer;
        } catch (error) {
            throw new Error('Erreur lors de la création du client: ' + error.message);
        }
    }

    static async findAll(filters = {}) {
        const { activity_id, date, point_vente, type_client } = filters;
        let query = 'SELECT * FROM customers WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (activity_id) {
            query += ` AND activity_id = $${paramIndex}`;
            params.push(activity_id);
            paramIndex++;
        }

        if (date) {
            query += ` AND date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }

        if (point_vente) {
            query += ` AND point_vente = $${paramIndex}`;
            params.push(point_vente);
            paramIndex++;
        }

        if (type_client) {
            query += ` AND type_client = $${paramIndex}`;
            params.push(type_client);
            paramIndex++;
        }

        query += ' ORDER BY created_at DESC';

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
            throw new Error('Erreur lors de la récupération des clients: ' + error.message);
        }
    }

    static async findAllWithPagination(filters = {}, offset = 0, limit = 50) {
        const { telephone, nom_client, point_vente, type_client, dateDebut, dateFin } = filters;
        let query = 'SELECT * FROM customers WHERE 1=1';
        let countQuery = 'SELECT COUNT(*) as count FROM customers WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Construire les conditions WHERE
        let whereConditions = '';

        if (telephone) {
            whereConditions += ` AND telephone ILIKE $${paramIndex}`;
            params.push(`%${telephone}%`);
            paramIndex++;
        }

        if (nom_client) {
            whereConditions += ` AND nom_client ILIKE $${paramIndex}`;
            params.push(`%${nom_client}%`);
            paramIndex++;
        }

        if (point_vente) {
            whereConditions += ` AND point_vente = $${paramIndex}`;
            params.push(point_vente);
            paramIndex++;
        }

        if (type_client) {
            whereConditions += ` AND type_client = $${paramIndex}`;
            params.push(type_client);
            paramIndex++;
        }

        if (dateDebut) {
            whereConditions += ` AND date >= $${paramIndex}`;
            params.push(dateDebut);
            paramIndex++;
        }

        if (dateFin) {
            whereConditions += ` AND date <= $${paramIndex}`;
            params.push(dateFin);
            paramIndex++;
        }

        query += whereConditions;
        countQuery += whereConditions;
        query += ` ORDER BY date DESC, created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

        try {
            // Récupérer le nombre total
            const countResult = await pool.query(countQuery, params);
            const totalCount = parseInt(countResult.rows[0].count);

            // Récupérer les clients paginés
            const result = await pool.query(query, [...params, limit, offset]);
            
            // Convertir les dates
            const customers = result.rows.map(row => ({
                ...row,
                date: row.date instanceof Date 
                    ? row.date.toISOString().split('T')[0] 
                    : row.date
            }));

            return { customers, totalCount };
        } catch (error) {
            throw new Error('Erreur lors de la récupération des clients: ' + error.message);
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT * FROM customers WHERE id = $1',
                [id]
            );
            const customer = result.rows[0];
            if (customer && customer.date instanceof Date) {
                customer.date = customer.date.toISOString().split('T')[0];
            }
            return customer;
        } catch (error) {
            throw new Error('Erreur lors de la récupération du client: ' + error.message);
        }
    }

    static async findByPhone(telephone) {
        try {
            const result = await pool.query(
                'SELECT * FROM customers WHERE telephone = $1 ORDER BY created_at DESC',
                [telephone]
            );
            return result.rows;
        } catch (error) {
            throw new Error('Erreur lors de la recherche par téléphone: ' + error.message);
        }
    }

    static async checkPhoneExists(telephone) {
        try {
            const countResult = await pool.query(
                'SELECT COUNT(*) as count FROM customers WHERE telephone = $1',
                [telephone]
            );
            
            const count = parseInt(countResult.rows[0].count);
            const exists = count > 0;
            
            let comment_connu = null;
            if (exists) {
                // Récupérer le premier "comment_connu" non null
                const firstResult = await pool.query(
                    'SELECT comment_connu FROM customers WHERE telephone = $1 AND comment_connu IS NOT NULL ORDER BY created_at ASC LIMIT 1',
                    [telephone]
                );
                if (firstResult.rows.length > 0) {
                    comment_connu = firstResult.rows[0].comment_connu;
                }
            }
            
            return {
                exists,
                count,
                comment_connu
            };
        } catch (error) {
            throw new Error('Erreur lors de la vérification du téléphone: ' + error.message);
        }
    }

    static async update(id, customerData) {
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
        } = customerData;

        try {
            const result = await pool.query(
                `UPDATE customers 
                SET date = $1, telephone = $2, nom_client = $3, point_vente = $4, 
                    montant_commande = $5, type_client = $6, comment_connu = $7, 
                    commentaire_client = $8, note_qualite_produits = $9, 
                    note_niveau_prix = $10, note_service_commercial = $11
                WHERE id = $12 
                RETURNING *`,
                [date, telephone, nom_client, point_vente, montant_commande,
                 type_client, comment_connu, commentaire_client, note_qualite_produits,
                 note_niveau_prix, note_service_commercial, id]
            );
            const customer = result.rows[0];
            if (customer && customer.date instanceof Date) {
                customer.date = customer.date.toISOString().split('T')[0];
            }
            return customer;
        } catch (error) {
            throw new Error('Erreur lors de la mise à jour du client: ' + error.message);
        }
    }

    static async delete(id) {
        try {
            const result = await pool.query(
                'DELETE FROM customers WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Erreur lors de la suppression du client: ' + error.message);
        }
    }

    static async getStats(filters = {}) {
        const { activity_id, date, point_vente, dateDebut, dateFin, telephone, nom_client, type_client } = filters;
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (activity_id) {
            whereClause += ` AND activity_id = $${paramIndex}`;
            params.push(activity_id);
            paramIndex++;
        }

        if (date) {
            whereClause += ` AND date = $${paramIndex}`;
            params.push(date);
            paramIndex++;
        }

        if (dateDebut) {
            whereClause += ` AND date >= $${paramIndex}`;
            params.push(dateDebut);
            paramIndex++;
        }

        if (dateFin) {
            whereClause += ` AND date <= $${paramIndex}`;
            params.push(dateFin);
            paramIndex++;
        }

        if (point_vente) {
            whereClause += ` AND point_vente = $${paramIndex}`;
            params.push(point_vente);
            paramIndex++;
        }

        if (telephone) {
            whereClause += ` AND telephone ILIKE $${paramIndex}`;
            params.push(`%${telephone}%`);
            paramIndex++;
        }

        if (nom_client) {
            whereClause += ` AND nom_client ILIKE $${paramIndex}`;
            params.push(`%${nom_client}%`);
            paramIndex++;
        }

        if (type_client) {
            whereClause += ` AND type_client = $${paramIndex}`;
            params.push(type_client);
            paramIndex++;
        }

        try {
            const result = await pool.query(
                `SELECT 
                    COUNT(*) as total_clients,
                    SUM(montant_commande) as montant_total,
                    COUNT(CASE WHEN type_client = 'Nouveau' THEN 1 END) as nouveaux_clients,
                    COUNT(CASE WHEN type_client = 'Récurrent' THEN 1 END) as clients_recurrents,
                    AVG(note_globale) as note_moyenne,
                    AVG(note_qualite_produits) as note_qualite_moyenne,
                    AVG(note_niveau_prix) as note_prix_moyenne,
                    AVG(note_service_commercial) as note_service_moyenne
                FROM customers 
                ${whereClause}`,
                params
            );
            
            const stats = result.rows[0];
            return {
                total_clients: parseInt(stats.total_clients) || 0,
                montant_total: parseInt(stats.montant_total) || 0,
                nouveaux_clients: parseInt(stats.nouveaux_clients) || 0,
                clients_recurrents: parseInt(stats.clients_recurrents) || 0,
                taux_nouveaux: stats.total_clients > 0 
                    ? Math.round((stats.nouveaux_clients / stats.total_clients) * 100) 
                    : 0,
                taux_recurrents: stats.total_clients > 0 
                    ? Math.round((stats.clients_recurrents / stats.total_clients) * 100) 
                    : 0,
                note_moyenne: stats.note_moyenne ? parseFloat(stats.note_moyenne).toFixed(1) : null,
                note_qualite_moyenne: stats.note_qualite_moyenne ? parseFloat(stats.note_qualite_moyenne).toFixed(1) : null,
                note_prix_moyenne: stats.note_prix_moyenne ? parseFloat(stats.note_prix_moyenne).toFixed(1) : null,
                note_service_moyenne: stats.note_service_moyenne ? parseFloat(stats.note_service_moyenne).toFixed(1) : null
            };
        } catch (error) {
            throw new Error('Erreur lors du calcul des statistiques: ' + error.message);
        }
    }
}

module.exports = Customer;
