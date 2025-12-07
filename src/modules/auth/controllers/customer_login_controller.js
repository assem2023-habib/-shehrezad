/**
 * Customer Login Controller - تسجيل دخول العميل بالكود
 */

const pool = require('../../../config/dbconnect');
const jwt = require('jsonwebtoken');
const response = require('../../../config/response_helper');
const { USER_ROLES } = require('../../../config/constants');

/**
 * تسجيل دخول العميل بالكود
 * POST /auth/customer-login
 */
const customerLogin = async (req, res) => {
  try {
    const { customer_code } = req.body;

    if (!customer_code) {
      return response.badRequest(res, 'يرجى إدخال كود العميل');
    }

    // البحث عن العميل
    const users = await pool.query(
      'SELECT * FROM users WHERE customer_code = ? AND role = ? LIMIT 1',
      [customer_code.toUpperCase(), USER_ROLES.CUSTOMER]
    );

    if (!users.length) {
      return response.unauthorized(res, 'كود العميل غير صحيح');
    }

    const user = users[0];

    // توليد JWT
    const token = jwt.sign(
      {
        user_id: user.user_id,
        role: user.role,
        customer_code: user.customer_code,
        invoice_image: user.invoice_image,
        phone: user.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return response.success(res, {
      token,
      expiresIn: 30 * 24 * 60 * 60,
      user_info: {
        user_id: user.user_id,
        full_name: user.full_name,
        invoice_image: user.invoice_image,
        phone: user.phone,
        customer_code: user.customer_code,
        role: user.role
      }
    }, 'تم تسجيل الدخول بنجاح');

  } catch (error) {
    console.error('Customer Login Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء تسجيل الدخول');
  }
};

module.exports = { customerLogin };
