const response = require("../../../config/response_helper");
const { loginEmployee } = require("../services/auth_login");

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await loginEmployee(email, password);
    return response.success(res, result, "تم تسجيل الدخول بنجاح.");
  } catch (error) {
    console.error("Login error:", error);
    if (error.message.includes("غير صحيحة")) {
      return response.badRequest(res, error.message);
    }
    if (error.message.includes("مخصص")) {
      return response.forbidden(res, error.message);
    }
    return response.serverError(res, "حدث خطأ في الخادم.");
  }
};

module.exports = { loginUser };
