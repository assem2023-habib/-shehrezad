const express = require("express");
const router = express.Router();

const { verifyToken , checkRole } = require("../../../middleware/verifytoken");
const { logout } = require("../controllers/logout_controller");


// dashboard logout
router.post("/logout",verifyToken,checkRole(["super_admin", "employee"]),logout);

module.exports = router;
