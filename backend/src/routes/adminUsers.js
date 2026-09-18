const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const {
    createAdminUser,
    getAdminUsers,
    updateAdminUserStatus,
} = require("../controllers/adminUsersController");

const router = express.Router();

router.use(requireAdmin, requireSuperAdmin);
router.get("/", getAdminUsers);
router.post("/", createAdminUser);
router.patch("/:id/status", updateAdminUserStatus);

module.exports = router;
