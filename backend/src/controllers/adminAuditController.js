const pool = require("../config/db");
const { ensureAdminAuditSchema } = require("../services/adminAudit");

exports.getAuditEvents = async(req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
    try {
        await ensureAdminAuditSchema();
        const result = await pool.query(
            `SELECT id, actor_username, action, entity_type, entity_id, request_path, created_at
             FROM admin_audit_log
             ORDER BY created_at DESC
             LIMIT $1`,
            [limit]
        );
        return res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error("Admin audit list error:", error);
        return res.status(500).json({ success: false, message: "İşlem geçmişi alınamadı." });
    }
};
