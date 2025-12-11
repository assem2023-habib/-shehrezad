/**
 * Customer Login Controller - تسجيل دخول العميل بالكود
 */

const response = require('../../../config/response_helper');
const { loginCustomer } = require('../services/auth_login');

/**
 * تسجيل دخول العميل بالكود
 * POST /auth/customer-login
 */
const customerLogin = async (req, res) => {
  try {
    const { customer_code } = req.body;
    const result = await loginCustomer(customer_code);
    return response.success(res, result, 'تم تسجيل الدخول بنجاح');
  } catch (error) {
    console.error('Customer Login Error:', error);
    if (error.message.includes('غير صحيح')) {
      return response.unauthorized(res, error.message);
    }
    return response.serverError(res, 'حدث خطأ أثناء تسجيل الدخول');
  }
};

module.exports = { customerLogin };
