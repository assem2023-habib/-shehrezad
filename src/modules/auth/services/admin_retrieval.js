/**
 * Admin Retrieval Service
 * خدمة جلب بيانات الموظفين والمسؤولين
 */

const pool = require('../../../config/dbconnect');
const { USER_ROLES } = require('../../../config/constants');

const getAllEmployees = async () => {
    const employees = await pool.query(`
    SELECT user_id, full_name, email, phone, role, created_at
    FROM users 
    WHERE role = ?
    ORDER BY created_at DESC
  `, [USER_ROLES.ADMIN]);

    return employees;
};

const getEmployeeById = async (employeeId) => {
    const employee = await pool.query(`
    SELECT user_id, full_name, email, phone, role, created_at
    FROM users 
    WHERE user_id = ? AND role = ?
  `, [employeeId, USER_ROLES.ADMIN]);

    if (!employee.length) {
        throw new Error('الموظف غير موجود');
    }

    return employee[0];
};

module.exports = {
    getAllEmployees,
    getEmployeeById
};
