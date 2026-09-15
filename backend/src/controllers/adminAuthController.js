const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

        if (username !== process.env.ADMIN_USERNAME) {
            return res.status(401).json({
                success: false,
                message: "Kullanıcı adı veya şifre hatalı.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            process.env.ADMIN_PASSWORD_HASH
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Kullanıcı adı veya şifre hatalı.",
            });
        }

        const token = jwt.sign({
                role: "admin",
                username: process.env.ADMIN_USERNAME,
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

        return res.json({
            success: true,
            message: "Giriş başarılı.",
            user: {
                username: process.env.ADMIN_USERNAME,
                role: "admin",
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