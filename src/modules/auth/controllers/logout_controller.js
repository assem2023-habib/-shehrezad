const pool = require("../../../config/dbconnect");
const response = require("../../../config/response_helper");

// Dashboard Logout
const logout = async (req, res) => {
  try {
    const token = req.token; // مأخوذ من verifyToken
    const user_id = req.user.user_id;

    // حفظ التوكن في جدول التوكنات الملغاة
    await pool.query(
      "INSERT INTO invalid_tokens (token, user_id) VALUES (?, ?)",
      [token, user_id]
    );

    return response.success(res, null, "تم تسجيل الخروج بنجاح");

  } catch (error) {
    console.error("Logout Error:", error);
    return response.serverError(res, "حدث خطأ أثناء تسجيل الخروج");
  }
};

module.exports = { logout };
