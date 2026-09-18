require("dotenv").config();

const pool = require("../src/config/db");
const { ensureAdminUsersSchema } = require("../src/services/adminUsers");

ensureAdminUsersSchema()
    .then(async() => {
        const result = await pool.query(
            "SELECT username, display_name, role, is_active FROM admin_users ORDER BY created_at ASC"
        );
        console.log(`Admin kullanıcı yapısı hazır. Kayıt sayısı: ${result.rowCount}`);
    })
    .catch((error) => {
        console.error("Admin kullanıcı yapısı hazırlanamadı:", error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
