const express = require("express");

const {
    login,
    logout,
    me,
    changePassword,
} = require("../controllers/adminAuthController");

const requireAdmin = require("../middleware/requireAdmin");
const adminLoginRateLimit = require("../middleware/adminLoginRateLimit");

const router = express.Router();

router.post("/login", adminLoginRateLimit, login);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);
router.patch("/password", requireAdmin, changePassword);

module.exports = router;