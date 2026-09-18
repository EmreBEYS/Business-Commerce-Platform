const { randomUUID } = require("node:crypto");
const pool = require("../config/db");

let schemaPromise;

const ensureAdminUsersSchema = async() => {
    if (!schemaPromise) {
        schemaPromise = (async() => {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id UUID PRIMARY KEY,
                    username VARCHAR(50) NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    password_hash VARCHAR(100) NOT NULL,
                    role VARCHAR(30) NOT NULL DEFAULT 'admin',
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    token_version INTEGER NOT NULL DEFAULT 0,
                    last_login_at TIMESTAMPTZ,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT admin_users_role_check CHECK (role IN ('admin', 'super_admin'))
                )
            `);
            await pool.query(
                "ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0"
            );
            await pool.query(
                "CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_lower_uidx ON admin_users (LOWER(username))"
            );

            if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD_HASH) {
                await pool.query(
                    `
                        INSERT INTO admin_users (
                            id, username, display_name, password_hash, role, is_active
                        )
                        SELECT $1, $2, $3, $4, 'super_admin', TRUE
                        WHERE NOT EXISTS (SELECT 1 FROM admin_users)
                        ON CONFLICT DO NOTHING
                    `,
                    [
                        randomUUID(),
                        process.env.ADMIN_USERNAME.trim(),
                        "Ana Yönetici",
                        process.env.ADMIN_PASSWORD_HASH,
                    ]
                );
            }
        })().catch((error) => {
            schemaPromise = null;
            throw error;
        });
    }

    return schemaPromise;
};

module.exports = { ensureAdminUsersSchema };
