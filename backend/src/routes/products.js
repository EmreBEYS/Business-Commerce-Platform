const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get("/", async(req, res) => {
    try {
        const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 24, 1), 100);
        const q = String(req.query.q || "").trim();
        const brand = String(req.query.brand || "").trim();
        const categoryId = String(req.query.categoryId || "").trim();

        if (categoryId && !UUID_PATTERN.test(categoryId)) {
            return res.status(400).json({ status: "error", message: "Geçersiz kategori." });
        }

        const values = [];
        const conditions = [];
        const addValue = (value) => { values.push(value); return `$${values.length}`; };

        if (q) {
            const parameter = addValue(`%${q}%`);
            const normalized = (column) => `LOWER(TRANSLATE(${column}, 'İIı', 'iii'))`;
            const normalizedParameter = `LOWER(TRANSLATE(${parameter}, 'İIı', 'iii'))`;
            conditions.push(`(${normalized("p.name")} LIKE ${normalizedParameter} OR ${normalized("p.brand")} LIKE ${normalizedParameter} OR ${normalized("p.category")} LIKE ${normalizedParameter} OR ${normalized("p.slug")} LIKE ${normalizedParameter})`);
        }
        if (brand) conditions.push(`p.brand ILIKE ${addValue(brand)}`);
        if (categoryId) {
            const categoryParameter = addValue(categoryId);
            conditions.push(`p.category_id IN (
                WITH RECURSIVE category_tree AS (
                    SELECT id FROM categories WHERE id = ${categoryParameter}
                    UNION ALL
                    SELECT child.id
                    FROM categories child
                    JOIN category_tree parent ON child.parent_id = parent.id
                )
                SELECT id FROM category_tree
            )`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const sort = {
            "name-desc": "p.name DESC",
            newest: "p.created_at DESC",
        }[req.query.sort] || "p.name ASC";
        const countValues = [...values];
        const limitParameter = addValue(limit);
        const offsetParameter = addValue((page - 1) * limit);

        const [result, countResult, brandsResult] = await Promise.all([
            pool.query(`
                SELECT p.id, p.name, p.slug, p.category, p.brand, p.description,
                       p.image_url, p.availability, p.stock_quantity, p.category_id,
                       c.path AS category_path
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                ${where}
                ORDER BY ${sort}
                LIMIT ${limitParameter} OFFSET ${offsetParameter}
            `, values),
            pool.query(`SELECT COUNT(*)::integer AS total FROM products p ${where}`, countValues),
            pool.query("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand <> '' ORDER BY brand ASC"),
        ]);

        const total = countResult.rows[0].total;

        res.json({
            status: "ok",
            count: result.rowCount,
            products: result.rows,
            brands: brandsResult.rows.map((item) => item.brand),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Products could not be fetched."
        });
    }
});

router.get("/:id", async(req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
        return res.status(400).json({ status: "error", message: "Geçersiz ürün kimliği." });
    }

    try {
        const result = await pool.query(`
            SELECT p.id, p.name, p.slug, p.category, p.brand, p.description, p.image_url,
                   p.availability, p.stock_quantity, p.category_id, c.path AS category_path
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = $1
        `, [req.params.id]);

        if (!result.rowCount) return res.status(404).json({ status: "error", message: "Ürün bulunamadı." });
        return res.json({ status: "ok", product: result.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Product could not be fetched." });
    }
});

module.exports = router;
