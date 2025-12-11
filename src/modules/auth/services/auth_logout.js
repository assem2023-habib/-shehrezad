/**
 * Auth Logout Service
 * خدمة تسجيل الخروج
 */

const { invalidateToken } = require('./auth_helpers');

const logoutUser = async (token, userId) => {
    if (!token || !userId) {
        throw new Error('بيانات غير كافية لتسجيل الخروج');
    }

    await invalidateToken(token, userId);
    return true;
};

module.exports = {
    logoutUser
};
