const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { ensureAdminUsersSchema } = require("../services/adminUsers");

const COOKIE_NAME = "admin_token";

exports.login = async(req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı ve şifre zorunludur.",
            });
        }

        if (typeof username !== "string" || typeof password !== "string") {
            return res.status(401).json({
                success: false,
                message: "Kullanıcı adı veya şifre hatalı.",
            });
        }

        await ensureAdminUsersSchema();
        const result = await pool.query(
            `
                SELECT id, username, display_name, password_hash, role, is_active, token_version
                FROM admin_users
                WHERE LOWER(username) = LOWER($1)
                LIMIT 1
            `,
            [username.trim()]
        );
        const user = result.rows[0];
        const passwordMatches = user && user.is_active
            ? await bcrypt.compare(password, user.password_hash)
            : false;

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Kullanıcı adı veya şifre hatalı.",
            });
        }

        const token = jwt.sign({
                adminId: user.id,
                role: user.role,
                username: user.username,
                displayName: user.display_name,
                tokenVersion: user.token_version,
            },
            process.env.JWT_SECRET, {
                expiresIn: "8h",
            }
        );

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 8 * 60 * 60 * 1000,
        });

        await pool.query(
            "UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
            [user.id]
        );

        return res.json({
            success: true,
            message: "Giriş başarılı.",
            user: {
                id: user.id,
                username: user.username,
                displayName: user.display_name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            success: false,
            message: "Sunucu hatası.",
        });
    }
};

exports.logout = (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.json({
        success: true,
        message: "Çıkış başarılı.",
    });
};

exports.me = (req, res) => {
    return res.json({
        success: true,
        user: req.admin,
    });
};

exports.changePassword = async(req, res) => {
    const currentPassword = typeof req.body.currentPassword === "string" ? req.body.currentPassword : "";
    const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : "";

    if (!currentPassword || newPassword.length < 10 || newPassword.length > 128) {
        return res.status(400).json({
            success: false,
            message: "Mevcut şifrenizi ve en az 10 karakterlik yeni şifrenizi girin.",
        });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: "Yeni şifre mevcut şifreden farklı olmalıdır." });
    }

    try {
        const result = await pool.query(
            "SELECT password_hash FROM admin_users WHERE id = $1 AND is_active = TRUE",
            [req.admin.id]
        );
        if (!result.rowCount || !await bcrypt.compare(currentPassword, result.rows[0].password_hash)) {
            return res.status(401).json({ success: false, message: "Mevcut şifre hatalı." });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.query(
            `UPDATE admin_users
             SET password_hash = $1, token_version = token_version + 1, updated_at = NOW()
             WHERE id = $2`,
            [passwordHash, req.admin.id]
        );
        res.clearCookie(COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });
        return res.json({ success: true, message: "Şifreniz değiştirildi. Lütfen yeniden giriş yapın." });
    } catch (error) {
        console.error("Admin password change error:", error);
        return res.status(500).json({ success: false, message: "Şifre değiştirilemedi." });
    }
};
