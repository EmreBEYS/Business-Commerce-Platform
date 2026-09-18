const { randomUUID } = require("node:crypto");
const pool = require("../config/db");

let schemaPromise;

const ensureAdminAuditSchema = async() => {
    if (!schemaPromise) {
        schemaPromise = pool.query(`
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                id UUID PRIMARY KEY,
                admin_id UUID,
                actor_username VARCHAR(50) NOT NULL,
                action VARCHAR(80) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id VARCHAR(120),
                request_path VARCHAR(500) NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `).catch((error) => {
            schemaPromise = null;
            throw error;
        });
    }
    return schemaPromise;
};

const recordAdminAudit = async({ admin, method, path }) => {
    if (!admin || !["POST", "PATCH", "DELETE"].includes(method)) return;
    await ensureAdminAuditSchema();
    const cleanPath = path.split("?")[0];
    const parts = cleanPath.split("/").filter(Boolean);
    const adminIndex = parts.indexOf("admin");
    const entityType = parts[adminIndex + 1] || "system";
    const entityId = parts[adminIndex + 2] || null;
    const action = method + "_" + entityType.toUpperCase();

    await pool.query(
        `INSERT INTO admin_audit_log
         (id, admin_id, actor_username, action, entity_type, entity_id, request_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [randomUUID(), admin.id || null, admin.username, action, entityType, entityId, cleanPath]
    );
};

module.exports = { ensureAdminAuditSchema, recordAdminAudit };
