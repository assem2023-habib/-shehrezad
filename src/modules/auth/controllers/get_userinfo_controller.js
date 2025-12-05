const pool = require("../../../config/dbconnect");
const response = require("../../../config/response_helper");

const getCurrentUser = async (req, res) => {
  try {
    const user_id = req.user.user_id; // جاي من verifyToken

    const rows = await pool.query(
      "SELECT user_id AS id, full_name AS name, email, phone, role, customer_code, created_at AS createdAt FROM users WHERE user_id = ? LIMIT 1",
      [user_id]
    );

    if (!rows || rows.length === 0) {
      return response.notFound(res, "المستخدم غير موجود");
    }

    return response.success(res, rows[0], "تم جلب بيانات المستخدم");

  } catch (error) {
    console.error("Get Current User Error:", error);
    return response.serverError(res, "حدث خطأ أثناء جلب بيانات المستخدم");
  }
};

module.exports = { getCurrentUser };
