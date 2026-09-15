const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const {
    createCategory,
    getCategories,
    updateCategory,
} = require("../controllers/adminCategoriesController");

const router = express.Router();

router.get("/", requireAdmin, getCategories);
router.post("/", requireAdmin, createCategory);
router.patch("/:id", requireAdmin, updateCategory);

module.exports = router;
