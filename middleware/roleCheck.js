const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Utilisateur non authentifié' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.' 
            });
        }

        next();
    };
};

module.exports = checkRole;
