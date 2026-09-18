const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const { productImageUpload } = require("../middleware/productImageUpload");
const {
    createProduct,
    deleteProduct,
    deleteProductImage,
    getProducts,
    updateProduct,
} = require("../controllers/adminProductsController");

const router = express.Router();

router.get("/", requireAdmin, getProducts);
router.post("/", requireAdmin, productImageUpload, createProduct);
router.patch("/:id", requireAdmin, productImageUpload, updateProduct);
router.delete("/:id/image", requireAdmin, deleteProductImage);
router.delete("/:id", requireAdmin, deleteProduct);

module.exports = router;
