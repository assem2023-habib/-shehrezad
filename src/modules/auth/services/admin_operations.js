/**
 * Admin Operations Service
 * خدمة إدارة الموظفين والمسؤولين
 */

const pool = require('../../../config/dbconnect');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../../../config/constants');

const createEmployee = async (fullName, email, password, phone) => {
    if (!fullName || !email || !password || !phone) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
    }

    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
        throw new Error('البريد الإلكتروني مستخدم مسبقاً');
    }

    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = ?', [phone]);
    if (phoneCheck.length > 0) {
        throw new Error('رقم الهاتف مستخدم مسبقاً');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
    INSERT INTO users (full_name, email, password, phone, role)
    VALUES (?, ?, ?, ?, ?)
  `, [fullName, email, hashedPassword, phone, USER_ROLES.ADMIN]);

    return {
        user_id: result.insertId,
        full_name: fullName,
        email,
        phone,
        role: USER_ROLES.ADMIN
    };
};

const updateEmployee = async (employeeId, updateData) => {
    const { full_name, email, phone, password } = updateData;

    const employee = await pool.query(
        'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
        [employeeId, USER_ROLES.ADMIN]
    );

    if (!employee.length) {
        throw new Error('الموظف غير موجود');
    }

    const updates = [];
    const values = [];

    if (full_name) {
        updates.push('full_name = ?');
        values.push(full_name);
    }

    if (email) {
        const emailCheck = await pool.query(
            'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
            [email, employeeId]
        );
        if (emailCheck.length > 0) {
            throw new Error('البريد الإلكتروني مستخدم مسبقاً');
        }
        updates.push('email = ?');
        values.push(email);
    }

    if (phone) {
        const phoneCheck = await pool.query(
            'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
            [phone, employeeId]
        );
        if (phoneCheck.length > 0) {
            throw new Error('رقم الهاتف مستخدم مسبقاً');
        }
        updates.push('phone = ?');
        values.push(phone);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
    }

    if (updates.length === 0) {
        throw new Error('لا توجد بيانات للتحديث');
    }

    values.push(employeeId);
    await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
        values
    );

    return true;
};

const deleteEmployee = async (employeeId) => {
    const employee = await pool.query(
        'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
        [employeeId, USER_ROLES.ADMIN]
    );

    if (!employee.length) {
        throw new Error('الموظف غير موجود');
    }

    await pool.query('DELETE FROM users WHERE user_id = ?', [employeeId]);
    return true;
};

const setupSuperAdmin = async (setupKey, fullName, email, password, phone) => {
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
        throw new Error('مفتاح الإعداد غير صحيح');
    }

    if (!fullName || !email || !password || !phone) {
        throw new Error('يرجى ملء جميع الحقول المطلوبة');
    }

    const existingSuper = await pool.query(
        'SELECT user_id FROM users WHERE role = ? LIMIT 1',
        [USER_ROLES.SUPER_ADMIN]
    );

    if (existingSuper.length > 0) {
        throw new Error('تم إعداد Super Admin مسبقاً. استخدم لوحة التحكم لإضافة موظفين.');
    }

    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
        throw new Error('البريد الإلكتروني مستخدم مسبقاً');
    }

    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = ?', [phone]);
    if (phoneCheck.length > 0) {
        throw new Error('رقم الهاتف مستخدم مسبقاً');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
    INSERT INTO users (full_name, email, password, phone, role)
    VALUES (?, ?, ?, ?, ?)
  `, [fullName, email, hashedPassword, phone, USER_ROLES.SUPER_ADMIN]);

    return {
        user_id: result.insertId,
        full_name: fullName,
        email,
        phone,
        role: USER_ROLES.SUPER_ADMIN
    };
};

module.exports = {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    setupSuperAdmin
};
