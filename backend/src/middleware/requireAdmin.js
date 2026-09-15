const jwt = require("jsonwebtoken");

module.exports = function requireAdmin(req, res, next) {
    const token = req.cookies && req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Admin girişi gerekli.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Bu işlem için yetkiniz yok.",
            });
        }

        req.admin = {
            username: decoded.username,
            role: decoded.role,
        };

        next();
    } catch {
        return res.status(401).json({
            success: false,
            message: "Oturum geçersiz veya süresi dolmuş.",
        });
    }
};