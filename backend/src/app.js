const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const pool = require("./config/db");

const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");
const adminAuthRoutes = require("./routes/adminAuth");
const adminDashboardRoutes = require("./routes/adminDashboard");
const adminProductsRoutes = require("./routes/adminProducts");
const adminCategoriesRoutes = require("./routes/adminCategories");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

// ==============================
// Middleware
// ==============================

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
                return;
            }

            const error = new Error("Bu origin için erişim izni yok.");
            error.status = 403;
            callback(error);
        },
        credentials: true,
    })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

// ==============================
// API Routes
// ==============================

app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);

// ==============================
// Health Check
// ==============================

app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Business Commerce Platform API is running.",
    });
});

// ==============================
// Database Test
// ==============================

app.get("/api/db-test", async(req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "ok",
            database: "business_commerce",
            serverTime: result.rows[0].now,
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed.",
        });
    }
});

// ==============================
// 404
// ==============================

app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found.",
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    return res.status(error.status || 500).json({
        status: "error",
        message: error.status ? error.message : "Sunucu hatası.",
    });
});

// ==============================
// Server
// ==============================

if (require.main === module) {
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
