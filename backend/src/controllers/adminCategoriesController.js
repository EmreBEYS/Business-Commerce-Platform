const pool = require("../config/db");
const { randomUUID } = require("node:crypto");

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EDITABLE_FIELDS = new Set(["name", "parentId"]);

const slugify = (value) => value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220) || "kategori";

const validateCategory = (body, { partial = false } = {}) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Geçerli bir kategori bilgisi gönderilmelidir.";
    }

    const fields = Object.keys(body);
    if (fields.length === 0) return "En az bir kategori alanı gönderilmelidir.";
    if (fields.some((field) => !EDITABLE_FIELDS.has(field))) {
        return "Gönderilen alanlardan biri değiştirilemez.";
    }
    if (!partial && !Object.hasOwn(body, "name")) return "Kategori adı zorunludur.";
    if (
        Object.hasOwn(body, "name") &&
        (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 200)
    ) {
        return "Kategori adı 2 ile 200 karakter arasında olmalıdır.";
    }
    if (Object.hasOwn(body, "name") && body.name.includes(">")) {
        return "Kategori adı > karakteri içeremez.";
    }
    if (
        Object.hasOwn(body, "parentId") &&
        body.parentId !== null &&
        (typeof body.parentId !== "string" || !UUID_PATTERN.test(body.parentId))
    ) {
        return "Geçerli bir üst kategori seçilmelidir.";
    }

    return null;
};

exports.getCategories = async(req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                c.id,
                c.name,
                c.slug,
                c.path,
                c.parent_id,
                parent.name AS parent_name,
                COUNT(p.id)::integer AS product_count
            FROM categories c
            LEFT JOIN categories parent ON parent.id = c.parent_id
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id, parent.name
            ORDER BY c.path ASC
        `);

        return res.json({
            success: true,
            count: result.rowCount,
            categories: result.rows,
        });
    } catch (error) {
        console.error("Admin categories error:", error);

        return res.status(500).json({
            success: false,
            message: "Kategoriler alınamadı.",
        });
    }
};

exports.createCategory = async(req, res) => {
    const validationError = validateCategory(req.body);
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");

        let parent = null;
        if (req.body.parentId) {
            const parentResult = await client.query(
                "SELECT id, name, path FROM categories WHERE id = $1",
                [req.body.parentId]
            );
            if (parentResult.rowCount === 0) {
                await client.query("ROLLBACK");
                return res.status(400).json({ success: false, message: "Üst kategori bulunamadı." });
            }
            parent = parentResult.rows[0];
        }

        const id = randomUUID();
        const name = req.body.name.trim();
        const path = parent ? `${parent.path} > ${name}` : name;
        if (path.length > 500) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Kategori yolu 500 karakteri aşamaz." });
        }
        const result = await client.query(
            `
                INSERT INTO categories (id, name, slug, path, parent_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, slug, path, parent_id
            `,
            [id, name, slugify(name), path, parent ? parent.id : null]
        );

        await client.query("COMMIT");
        return res.status(201).json({
            success: true,
            message: "Kategori eklendi.",
            category: {
                ...result.rows[0],
                parent_name: parent ? parent.name : null,
                product_count: 0,
            },
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Bu kategori yolu zaten kullanılıyor." });
        }
        console.error("Admin category create error:", error);
        return res.status(500).json({ success: false, message: "Kategori eklenemedi." });
    } finally {
        if (client) client.release();
    }
};

exports.updateCategory = async(req, res) => {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) {
        return res.status(400).json({ success: false, message: "Geçerli bir kategori kimliği gönderilmelidir." });
    }

    const validationError = validateCategory(req.body, { partial: true });
    if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
    }

    let client;

    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const allResult = await client.query(
            "SELECT id, name, slug, path, parent_id FROM categories FOR UPDATE"
        );
        const categories = new Map(allResult.rows.map((category) => [category.id, category]));
        const current = categories.get(id);

        if (!current) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, message: "Kategori bulunamadı." });
        }

        const originalName = current.name;
        const nextParentId = Object.hasOwn(req.body, "parentId") ? req.body.parentId : current.parent_id;
        const nextName = Object.hasOwn(req.body, "name") ? req.body.name.trim() : current.name;
        const descendants = new Set();
        const collectDescendants = (parentId) => {
            for (const category of categories.values()) {
                if (category.parent_id === parentId && !descendants.has(category.id)) {
                    descendants.add(category.id);
                    collectDescendants(category.id);
                }
            }
        };
        collectDescendants(id);

        if (nextParentId === id || (nextParentId && descendants.has(nextParentId))) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Kategori kendi alt kategorisine taşınamaz." });
        }

        const parent = nextParentId ? categories.get(nextParentId) : null;
        if (nextParentId && !parent) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Üst kategori bulunamadı." });
        }

        current.name = nextName;
        current.slug = slugify(nextName);
        current.parent_id = nextParentId;
        current.path = parent ? `${parent.path} > ${nextName}` : nextName;

        const affected = [current];
        const rebuildChildren = (parentCategory) => {
            for (const child of categories.values()) {
                if (child.parent_id === parentCategory.id && child.id !== id) {
                    child.path = `${parentCategory.path} > ${child.name}`;
                    affected.push(child);
                    rebuildChildren(child);
                }
            }
        };
        rebuildChildren(current);

        if (affected.some((category) => category.path.length > 500)) {
            await client.query("ROLLBACK");
            return res.status(400).json({ success: false, message: "Kategori yolu 500 karakteri aşamaz." });
        }

        const desiredPaths = new Set(affected.map((category) => category.path));
        if (desiredPaths.size !== affected.length) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Kategori yolları birbiriyle çakışıyor." });
        }

        const affectedIds = new Set(affected.map((category) => category.id));
        const pathConflict = [...categories.values()].some(
            (category) => !affectedIds.has(category.id) && desiredPaths.has(category.path)
        );
        if (pathConflict) {
            await client.query("ROLLBACK");
            return res.status(409).json({ success: false, message: "Bu kategori yolu zaten kullanılıyor." });
        }

        for (const category of affected) {
            await client.query(
                "UPDATE categories SET name = $1, slug = $2, path = $3, parent_id = $4 WHERE id = $5",
                [category.name, category.slug, category.path, category.parent_id, category.id]
            );
        }
        if (nextName !== originalName) {
            await client.query("UPDATE products SET category = $1 WHERE category_id = $2", [nextName, id]);
        }

        await client.query("COMMIT");
        return res.json({
            success: true,
            message: "Kategori güncellendi.",
            category: {
                id: current.id,
                name: current.name,
                slug: current.slug,
                path: current.path,
                parent_id: current.parent_id,
                parent_name: parent ? parent.name : null,
            },
        });
    } catch (error) {
        if (client) await client.query("ROLLBACK").catch(() => {});
        if (error.code === "23505") {
            return res.status(409).json({ success: false, message: "Bu kategori yolu zaten kullanılıyor." });
        }
        console.error("Admin category update error:", error);
        return res.status(500).json({ success: false, message: "Kategori güncellenemedi." });
    } finally {
        if (client) client.release();
    }
};

exports.validateCategory = validateCategory;
