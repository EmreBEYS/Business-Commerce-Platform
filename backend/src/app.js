const express = require("express");
const cors = require("cors");
const productsRouter = require("./routes/products");
const categoriesRouter = require("./routes/categories");

require("dotenv").config();

const pool = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);



app.get("/", (req, res) => {
    res.json({
        status: "ok",
        message: "Business Commerce Platform API is running."
    });
});

app.get("/api/db-test", async(req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "ok",
            database: "business_commerce",
            serverTime: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed."
        });
    }
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});