require('dotenv').config();

const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ 
            success: false,
            error: 'API key manquante. Veuillez fournir un x-api-key dans les headers.' 
        });
    }
    
    if (apiKey !== process.env.EXTERNAL_API_KEY) {
        return res.status(401).json({ 
            success: false,
            error: 'API key invalide.' 
        });
    }
    
    next();
};

module.exports = authenticateApiKey;
