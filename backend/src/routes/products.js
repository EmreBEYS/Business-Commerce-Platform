const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async(req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        id,
        name,
        slug,
        category,
        brand,
        description,
        image_url,
        availability,
        stock_quantity,
        source_url,
        category_id
      FROM products
      ORDER BY created_at DESC
      LIMIT 20
    `);

        res.json({
            status: "ok",
            count: result.rowCount,
            products: result.rows
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Products could not be fetched."
        });
    }
});

module.exports = router;