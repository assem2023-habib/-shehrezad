const pool = require("../../../config/dbconnect");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const response = require("../../../config/response_helper");
const { USER_ROLES } = require("../../../config/constants");

const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  // التحقق من المدخلات
  if (!email || !password) {
    return response.unauthorized(res, "الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
  }

  try {
    // البحث عن المستخدم
    const rows = await pool.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);

    if (!rows || rows.length === 0) {
      return response.badRequest(res, "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }

    const user = rows[0];

    // التحقق من أن المستخدم هو Super Admin
    if (user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, "هذا الرابط مخصص لدخول Super Admin فقط.");
    }

    // مقارنة كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return response.badRequest(res, "البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }

    // توليد JWT صالح 24 ساعة
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        phone: user.phone,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // الرد بالنجاح
    return response.success(res, {
      token: token,
      expiresIn: 86400,
      user_info: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    }, "تم تسجيل دخول Super Admin بنجاح.");

  } catch (error) {
    console.error("Super Admin Login error:", error);
    return response.serverError(res, "حدث خطأ في الخادم.");
  }
};

module.exports = { loginSuperAdmin };
