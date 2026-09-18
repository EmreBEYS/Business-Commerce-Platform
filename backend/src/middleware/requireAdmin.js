const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { ensureAdminUsersSchema } = require("../services/adminUsers");

module.exports = async function requireAdmin(req, res, next) {
    const token = req.cookies && req.cookies.admin_token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Admin girişi gerekli.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!["admin", "super_admin"].includes(decoded.role)) {
            return res.status(403).json({
                success: false,
                message: "Bu işlem için yetkiniz yok.",
            });
        }

        if (decoded.adminId) {
            await ensureAdminUsersSchema();
            const result = await pool.query(
                `
                    SELECT id, username, display_name, role, token_version
                    FROM admin_users
                    WHERE id = $1 AND is_active = TRUE
                `,
                [decoded.adminId]
            );

            if (result.rowCount === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Yönetici hesabı devre dışı veya bulunamadı.",
                });
            }

            const user = result.rows[0];
            if (Number(decoded.tokenVersion || 0) !== Number(user.token_version || 0)) {
                return res.status(401).json({
                    success: false,
                    message: "Oturum güvenlik nedeniyle sonlandırıldı. Lütfen yeniden giriş yapın.",
                });
            }
            req.admin = {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                role: user.role,
            };
        } else {
            req.admin = {
                username: decoded.username,
                displayName: decoded.displayName || decoded.username,
                role: decoded.role,
            };
        }

        next();
    } catch (error) {
        if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
            console.error("Admin authorization error:", error);
        }
        return res.status(401).json({
            success: false,
            message: "Oturum geçersiz veya süresi dolmuş.",
        });
    }
};
