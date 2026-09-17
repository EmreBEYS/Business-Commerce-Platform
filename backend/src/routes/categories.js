const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async(req, res) => {
    try {
        const result = await pool.query(`
            WITH RECURSIVE category_descendants AS (
                SELECT id AS ancestor_id, id AS descendant_id
                FROM categories
                UNION ALL
                SELECT tree.ancestor_id, child.id
                FROM category_descendants tree
                JOIN categories child ON child.parent_id = tree.descendant_id
            )
            SELECT
                c.id,
                c.name,
                c.slug,
                c.path,
                c.parent_id,
                COUNT(DISTINCT direct_product.id)::integer AS direct_product_count,
                COUNT(DISTINCT subtree_product.id)::integer AS product_count
            FROM categories c
            LEFT JOIN products direct_product ON direct_product.category_id = c.id
            LEFT JOIN category_descendants tree ON tree.ancestor_id = c.id
            LEFT JOIN products subtree_product ON subtree_product.category_id = tree.descendant_id
            GROUP BY c.id
            ORDER BY c.path ASC
        `);

        res.json({
            status: "ok",
            count: result.rowCount,
            categories: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Categories could not be fetched."
        });
    }
});

router.get("/:slug", async(req, res) => {
    try {
        const result = await pool.query(`
            WITH RECURSIVE category_descendants AS (
                SELECT id AS ancestor_id, id AS descendant_id
                FROM categories
                UNION ALL
                SELECT tree.ancestor_id, child.id
                FROM category_descendants tree
                JOIN categories child ON child.parent_id = tree.descendant_id
            )
            SELECT
                c.id,
                c.name,
                c.slug,
                c.path,
                c.parent_id,
                COUNT(DISTINCT direct_product.id)::integer AS direct_product_count,
                COUNT(DISTINCT subtree_product.id)::integer AS product_count
            FROM categories c
            LEFT JOIN products direct_product ON direct_product.category_id = c.id
            LEFT JOIN category_descendants tree ON tree.ancestor_id = c.id
            LEFT JOIN products subtree_product ON subtree_product.category_id = tree.descendant_id
            WHERE c.slug = $1
            GROUP BY c.id
        `, [req.params.slug]);

        if (!result.rowCount) {
            return res.status(404).json({ status: "error", message: "Kategori bulunamadı." });
        }

        return res.json({ status: "ok", category: result.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: "error", message: "Category could not be fetched." });
    }
});

module.exports = router;
