const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
} = require("../controllers/adminCategoriesController");

const router = express.Router();

router.get("/", requireAdmin, getCategories);
router.post("/", requireAdmin, createCategory);
router.patch("/:id", requireAdmin, updateCategory);
router.delete("/:id", requireAdmin, deleteCategory);

module.exports = router;
