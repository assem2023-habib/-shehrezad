const response = require("../../../config/response_helper");
const { logoutUser } = require("../services/auth_logout");

const logout = async (req, res) => {
  try {
    const token = req.token;
    const user_id = req.user.user_id;

    await logoutUser(token, user_id);
    return response.success(res, null, "تم تسجيل الخروج بنجاح");

  } catch (error) {
    console.error("Logout Error:", error);
    return response.serverError(res, "حدث خطأ أثناء تسجيل الخروج");
  }
};

module.exports = { logout };
