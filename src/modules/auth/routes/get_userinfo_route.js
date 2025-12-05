const express = require("express");
const router = express.Router();

const { verifyToken } = require("../../../middleware/verifytoken");
const { getCurrentUser } = require("../../auth/controllers/get_userinfo_controller");

// GET /api/auth/me
router.get("/auth/me", verifyToken, getCurrentUser);

module.exports = router;
