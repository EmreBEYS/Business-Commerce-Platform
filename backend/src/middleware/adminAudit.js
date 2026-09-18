const { recordAdminAudit } = require("../services/adminAudit");

module.exports = function adminAudit(req, res, next) {
    if (process.env.NODE_ENV === "test") return next();
    res.on("finish", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            recordAdminAudit({
                admin: req.admin,
                method: req.method,
                path: req.originalUrl,
            }).catch((error) => console.error("Admin audit error:", error));
        }
    });
    next();
};
