/**
 * Auth Login Service
 * خدمة تسجيل الدخول
 */

const pool = require('../../../config/dbconnect');
const { generateToken, generateCustomerToken, validatePassword, getExpiresInSeconds, USER_ROLES } = require('./auth_helpers');

const loginEmployee = async (email, password) => {
    if (!email || !password) {
        throw new Error('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
    }

    const rows = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

    if (!rows || rows.length === 0) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    const user = rows[0];

    const isMatch = await validatePassword(password, user.password);
    if (!isMatch) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.ACCOUNTANT) {
        throw new Error('هذا الرابط مخصص لدخول الموظفين والمحاسبين فقط.');
    }

    const token = generateToken(user, '24h');

    return {
        token,
        expiresIn: getExpiresInSeconds('24h'),
        user_info: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
        }
    };
};

const loginSuperAdmin = async (email, password) => {
    if (!email || !password) {
        throw new Error('الرجاء إدخال البريد الإلكتروني وكلمة المرور.');
    }

    const rows = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

    if (!rows || rows.length === 0) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    const user = rows[0];

    if (user.role !== USER_ROLES.SUPER_ADMIN) {
        throw new Error('هذا الرابط مخصص لدخول Super Admin فقط.');
    }

    const isMatch = await validatePassword(password, user.password);
    if (!isMatch) {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }

    const token = generateToken(user, '24h');

    return {
        token,
        expiresIn: getExpiresInSeconds('24h'),
        user_info: {
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
        }
    };
};

const loginCustomer = async (customer_code) => {
    if (!customer_code) {
        throw new Error('يرجى إدخال كود العميل');
    }

    const users = await pool.query(
        'SELECT * FROM users WHERE customer_code = ? AND role = ? LIMIT 1',
        [customer_code.toUpperCase(), USER_ROLES.CUSTOMER]
    );

    if (!users.length) {
        throw new Error('كود العميل غير صحيح');
    }

    const user = users[0];

    const token = generateCustomerToken(user, '30d');

    return {
        token,
        expiresIn: getExpiresInSeconds('30d'),
        user_info: {
            user_id: user.user_id,
            full_name: user.full_name,
            invoice_image: user.invoice_image,
            phone: user.phone,
            customer_code: user.customer_code,
            role: user.role
        }
    };
};

module.exports = {
    loginEmployee,
    loginSuperAdmin,
    loginCustomer
};
