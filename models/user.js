const pool = require('../config/db');
const bcrypt = require('bcrypt');

class User {
    static async findByUsername(username) {
        try {
            const result = await pool.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Erreur lors de la recherche de l\'utilisateur: ' + error.message);
        }
    }

    static async findById(id) {
        try {
            const result = await pool.query(
                'SELECT id, username, role, created_at FROM users WHERE id = $1',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Erreur lors de la recherche de l\'utilisateur: ' + error.message);
        }
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async create(username, password, role) {
        try {
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
                [username, passwordHash, role]
            );
            return result.rows[0];
        } catch (error) {
            throw new Error('Erreur lors de la création de l\'utilisateur: ' + error.message);
        }
    }
}

module.exports = User;
