const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('📦 Connexion à la base de données...');
        
        // Lire et exécuter le script SQL
        const sqlScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        await pool.query(sqlScript);
        console.log('✅ Tables créées avec succès');

        // Hasher les mots de passe et insérer les utilisateurs
        const didiPassword = await bcrypt.hash(process.env.USER_DIDI_PASSWORD, 10);
        const adminPassword = await bcrypt.hash(process.env.USER_ADMIN_PASSWORD, 10);

        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3), ($4, $5, $6)',
            [
                process.env.USER_DIDI_USERNAME,
                didiPassword,
                process.env.USER_DIDI_ROLE,
                process.env.USER_ADMIN_USERNAME,
                adminPassword,
                process.env.USER_ADMIN_ROLE
            ]
        );
        console.log('✅ Utilisateurs créés:');
        console.log(`   - ${process.env.USER_DIDI_USERNAME} (${process.env.USER_DIDI_ROLE})`);
        console.log(`   - ${process.env.USER_ADMIN_USERNAME} (${process.env.USER_ADMIN_ROLE})`);

        console.log('\n🎉 Initialisation terminée avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Si exécuté directement
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;
