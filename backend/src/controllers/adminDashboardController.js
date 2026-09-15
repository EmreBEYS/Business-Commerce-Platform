const pool = require("../config/db");

exports.getStats = async(req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products) AS total_products,
        (SELECT COUNT(*) FROM categories) AS total_categories,
        (
          SELECT COUNT(*)
          FROM products
          WHERE stock_quantity > 0
        ) AS in_stock,
        (
          SELECT COUNT(*)
          FROM products
          WHERE stock_quantity = 0
        ) AS out_of_stock
    `);

        const row = result.rows[0];

        return res.json({
            success: true,
            stats: {
                totalProducts: Number(row.total_products),
                totalCategories: Number(row.total_categories),
                inStock: Number(row.in_stock),
                outOfStock: Number(row.out_of_stock),
            },
        });
    } catch (error) {
        console.error("Admin dashboard stats error:", error);

        return res.status(500).json({
            success: false,
            message: "Dashboard istatistikleri alınamadı.",
        });
    }
};