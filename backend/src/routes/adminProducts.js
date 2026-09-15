const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const {
    createProduct,
    getProducts,
    updateProduct,
} = require("../controllers/adminProductsController");

const router = express.Router();

router.get("/", requireAdmin, getProducts);
router.post("/", requireAdmin, createProduct);
router.patch("/:id", requireAdmin, updateProduct);

module.exports = router;
