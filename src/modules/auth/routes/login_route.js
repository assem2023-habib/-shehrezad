const express = require("express");
const router = express.Router();

const { loginUser } = require("../controllers/login_controller");
const { validateLoginInput } = require("../../../middleware/validateinput"); // مخصص للـ login

// تسجيل الدخول
router.post("/login", validateLoginInput, loginUser);

module.exports = router;
