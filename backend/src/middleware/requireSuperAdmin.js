module.exports = function requireSuperAdmin(req, res, next) {
    if (!req.admin || req.admin.role !== "super_admin") {
        return res.status(403).json({
            success: false,
            message: "Bu işlem yalnızca ana yönetici tarafından yapılabilir.",
        });
    }

    next();
};
