const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const pool = require("../config/db");
const { ensureAdminUsersSchema } = require("../services/adminUsers");

const USERNAME_PATTERN = /^[a-z0-9._-]{3,50}$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_ACTIVE_ADMINS = 3;

exports.getAdminUsers = async(req, res) => {
    try {
        await ensureAdminUsersSchema();
        const result = await pool.query(`
            SELECT id, username, display_name, role, is_active, last_login_at, created_at
            FROM admin_users
            ORDER BY role DESC, created_at ASC
        `);

        return res.json({
            success: true,
            maxActiveAdmins: MAX_ACTIVE_ADMINS,
            activeCount: result.rows.filter((user) => user.is_active).length,
            users: result.rows,
        });
    } catch (error) {
        console.error("Admin users list error:", error);
        return res.status(500).json({ success: false, message: "Yöneticiler alınamadı." });
    }
};

exports.createAdminUser = async(req, res) => {
    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const displayName = typeof req.body.displayName === "string" ? req.body.displayName.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!USERNAME_PATTERN.test(username)) {
        return res.status(400).json({
            success: false,
            message: "Kullanıcı adı 3-50 karakter olmalı; harf, rakam, nokta, tire ve alt çizgi içerebilir.",
        });
    }
    if (displayName.length < 2 || displayName.length > 100) {
        return res.status(400).json({ success: false, message: "Görünen ad 2-100 karakter olmalıdır." });
    }
    if (password.length < 10 || password.length > 128) {
        return res.status(400).json({ success: false, message: "Şifre en az 10 karakter olmalıdır." });
    }

    let client;
    try {
        await ensureAdminUsersSchema();
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [935123]);

        const countResult = await client.query(
            "SELECT COUNT(*)::integer AS count FROM admin_users WHERE is_active = TRUE"
        );
        if (countResult.rows[0].count >= MAX_ACTIVE_ADMINS) {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                message: "En fazla 3 aktif yönetici hesabı oluşturabilirsiniz.",
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const result = await client.query(
            `
                INSERT INTO admin_users (
                    id, username, display_name, password_hash, role, is_active
                )
                VALUES ($1, $2, $3, $4, 'admin', TRUE)
                RETURNING id, username, display_name, role, is_active, last_login_at, created_at
            `,
            [randomUUID(), username, displayName, passwordHash]
        );
        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Yönetici hesabı oluşturuldu.",
            user: result.rows[0],
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Bu kullanıcı adı zaten kullanılıyor." });
        }
        console.error("Admin user create error:", error);
        return res.status(500).json({ success: false, message: "Yönetici hesabı oluşturulamadı." });
    } finally {
        if (client) client.release();
    }
};

exports.updateAdminUserStatus = async(req, res) => {
    const { id } = req.params;
    const { active } = req.body;

    if (!UUID_PATTERN.test(id)) {
        return res.status(400).json({ success: false, message: "Geçerli bir yönetici kimliği gönderilmelidir." });
    }
    if (typeof active !== "boolean") {
        return res.status(400).json({ success: false, message: "Geçerli bir hesap durumu gönderilmelidir." });
    }
    if (id === req.admin.id) {
        return res.status(400).json({ success: false, message: "Kendi hesabınızı devre dışı bırakamazsınız." });
    }

    let client;
    try {
        await ensureAdminUsersSchema();
        client = await pool.connect();
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock($1)", [935123]);

        if (active) {
            const countResult = await client.query(
                "SELECT COUNT(*)::integer AS count FROM admin_users WHERE is_active = TRUE"
            );
            if (countResult.rows[0].count >= MAX_ACTIVE_ADMINS) {
                await client.query("ROLLBACK");
                return res.status(409).json({ success: false, message: "En fazla 3 aktif yönetici olabilir." });
            }
        }

        const result = await client.query(
            `
                UPDATE admin_users
                SET is_active = $1, updated_at = NOW()
                WHERE id = $2 AND role <> 'super_admin'
                RETURNING id, username, display_name, role, is_active, last_login_at, created_at
            `,
            [active, id]
        );
        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Yönetici bulunamadı veya ana yönetici değiştirilemez." });
        }

        await client.query("COMMIT");
        return res.json({
            success: true,
            message: active ? "Yönetici hesabı etkinleştirildi." : "Yönetici hesabı devre dışı bırakıldı.",
            user: result.rows[0],
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        console.error("Admin user status update error:", error);
        return res.status(500).json({ success: false, message: "Hesap durumu güncellenemedi." });
    } finally {
        if (client) client.release();
    }
};
