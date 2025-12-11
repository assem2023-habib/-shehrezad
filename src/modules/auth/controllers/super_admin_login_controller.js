const response = require("../../../config/response_helper");
const { loginSuperAdmin: loginSuperAdminService } = require("../services/auth_login");

const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginSuperAdminService(email, password);
    return response.success(res, result, "تم تسجيل دخول Super Admin بنجاح.");
  } catch (error) {
    console.error("Super Admin Login error:", error);
    if (error.message.includes("غير صحيحة")) {
      return response.badRequest(res, error.message);
    }
    if (error.message.includes("مخصص")) {
      return response.forbidden(res, error.message);
    }
    return response.serverError(res, "حدث خطأ في الخادم.");
  }
};

module.exports = { loginSuperAdmin };
