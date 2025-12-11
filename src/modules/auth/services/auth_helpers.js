/**
 * Auth Helper Functions
 * دوال مساعدة للمصادقة
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../../../config/dbconnect');
const { USER_ROLES } = require('../../../config/constants');

const generateToken = (user, expiresIn = '24h') => {
    return jwt.sign(
        {
            user_id: user.user_id,
            role: user.role,
            phone: user.phone,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

const generateCustomerToken = (user, expiresIn = '30d') => {
    return jwt.sign(
        {
            user_id: user.user_id,
            role: user.role,
            customer_code: user.customer_code,
            invoice_image: user.invoice_image,
            phone: user.phone
        },
        process.env.JWT_SECRET,
        { expiresIn }
    );
};

const validatePassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
};

const invalidateToken = async (token, userId) => {
    await pool.query(
        'INSERT INTO invalid_tokens (token, user_id) VALUES (?, ?)',
        [token, userId]
    );
};

const getExpiresInSeconds = (expiresIn) => {
    if (expiresIn === '24h') return 86400;
    if (expiresIn === '30d') return 30 * 24 * 60 * 60;
    return 3600;
};

module.exports = {
    generateToken,
    generateCustomerToken,
    validatePassword,
    invalidateToken,
    getExpiresInSeconds,
    USER_ROLES
};
