const express = require("express");

const requireAdmin = require("../middleware/requireAdmin");
const {
    getStats,
} = require("../controllers/adminDashboardController");

const router = express.Router();

router.get("/stats", requireAdmin, getStats);

module.exports = router;