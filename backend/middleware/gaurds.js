// backend/middleware/guards.js

function ensureAuthenticated(req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.user.active) return res.status(403).json({ message: 'Account disabled' });
    return next();
}

function ensureAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    return next();
}

module.exports = { ensureAuthenticated, ensureAdmin };
