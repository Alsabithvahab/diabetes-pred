const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied: Administrators only' });
    }
};

module.exports = admin;
