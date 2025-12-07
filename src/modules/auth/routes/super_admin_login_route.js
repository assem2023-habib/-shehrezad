const express = require("express");
const router = express.Router();

const { loginSuperAdmin } = require("../controllers/super_admin_login_controller");
const { validateLoginInput } = require("../../../middleware/validateinput");

// تسجيل دخول Super Admin
router.post("/super-admin/login", validateLoginInput, loginSuperAdmin);

module.exports = router;
