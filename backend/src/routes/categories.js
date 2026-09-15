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
        path,
        parent_id
      FROM categories
      ORDER BY path ASC
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

module.exports = router;