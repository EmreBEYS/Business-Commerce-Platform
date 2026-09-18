const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const { getAuditEvents } = require("../controllers/adminAuditController");

const router = express.Router();
router.get("/", requireAdmin, requireSuperAdmin, getAuditEvents);

module.exports = router;
