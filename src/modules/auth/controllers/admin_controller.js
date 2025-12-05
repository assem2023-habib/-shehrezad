/**
 * Employee Management Controller
 * إدارة حسابات الموظفين - للـ Super Admin فقط
 */

const pool = require('../../../config/dbconnect');
const bcrypt = require('bcrypt');
const response = require('../../../config/response_helper');
const { USER_ROLES } = require('../../../config/constants');

/**
 * إنشاء موظف جديد
 * POST /api/dashboard/employees
 */
const createEmployee = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    // التحقق من أن الطالب هو super_admin
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع إنشاء موظفين');
    }

    // التحقق من المدخلات
    if (!full_name || !email || !password || !phone) {
      return response.badRequest(res, 'يرجى ملء جميع الحقول المطلوبة');
    }

    // التحقق من عدم تكرار البريد أو الهاتف
    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
      return response.badRequest(res, 'البريد الإلكتروني مستخدم مسبقاً');
    }

    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = ?', [phone]);
    if (phoneCheck.length > 0) {
      return response.badRequest(res, 'رقم الهاتف مستخدم مسبقاً');
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء الموظف
    const result = await pool.query(`
      INSERT INTO users (full_name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `, [full_name, email, hashedPassword, phone, USER_ROLES.ADMIN]);

    return response.created(res, {
      user_id: result.insertId,
      full_name,
      email,
      phone,
      role: USER_ROLES.ADMIN
    }, 'تم إنشاء الموظف بنجاح');

  } catch (error) {
    console.error('Create Employee Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء إنشاء الموظف');
  }
};

/**
 * جلب جميع الموظفين
 * GET /api/dashboard/employees
 */
const getAllEmployees = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع عرض قائمة الموظفين');
    }

    const employees = await pool.query(`
      SELECT user_id, full_name, email, phone, role, created_at
      FROM users 
      WHERE role = ?
      ORDER BY created_at DESC
    `, [USER_ROLES.ADMIN]);

    return response.success(res, employees);

  } catch (error) {
    console.error('Get Employees Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب قائمة الموظفين');
  }
};

/**
 * جلب موظف واحد
 * GET /api/dashboard/employees/:id
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع عرض بيانات الموظف');
    }

    const employee = await pool.query(`
      SELECT user_id, full_name, email, phone, role, created_at
      FROM users 
      WHERE user_id = ? AND role = ?
    `, [id, USER_ROLES.ADMIN]);

    if (!employee.length) {
      return response.notFound(res, 'الموظف غير موجود');
    }

    return response.success(res, employee[0]);

  } catch (error) {
    console.error('Get Employee Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب بيانات الموظف');
  }
};

/**
 * تحديث بيانات موظف
 * PUT /api/dashboard/employees/:id
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, password } = req.body;

    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع تعديل بيانات الموظفين');
    }

    // التحقق من وجود الموظف
    const employee = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
      [id, USER_ROLES.ADMIN]
    );

    if (!employee.length) {
      return response.notFound(res, 'الموظف غير موجود');
    }

    // بناء الاستعلام ديناميكياً
    const updates = [];
    const values = [];

    if (full_name) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (email) {
      // التحقق من عدم التكرار
      const emailCheck = await pool.query(
        'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
        [email, id]
      );
      if (emailCheck.length > 0) {
        return response.badRequest(res, 'البريد الإلكتروني مستخدم مسبقاً');
      }
      updates.push('email = ?');
      values.push(email);
    }
    if (phone) {
      const phoneCheck = await pool.query(
        'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
        [phone, id]
      );
      if (phoneCheck.length > 0) {
        return response.badRequest(res, 'رقم الهاتف مستخدم مسبقاً');
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
      return response.badRequest(res, 'لا توجد بيانات للتحديث');
    }

    values.push(id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );

    return response.success(res, null, 'تم تحديث بيانات الموظف بنجاح');

  } catch (error) {
    console.error('Update Employee Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء تحديث بيانات الموظف');
  }
};

/**
 * حذف موظف
 * DELETE /api/dashboard/employees/:id
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع حذف الموظفين');
    }

    // التحقق من وجود الموظف
    const employee = await pool.query(
      'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
      [id, USER_ROLES.ADMIN]
    );

    if (!employee.length) {
      return response.notFound(res, 'الموظف غير موجود');
    }

    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    return response.deleted(res, 'تم حذف الموظف بنجاح');

  } catch (error) {
    console.error('Delete Employee Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء حذف الموظف');
  }
};

/**
 * إعداد Super Admin الأولي
 * يعمل فقط إذا لم يوجد أي super_admin في النظام
 * POST /auth/setup-admin
 */
const setupSuperAdmin = async (req, res) => {
  try {
    const { setup_key, full_name, email, password, phone } = req.body;

    // التحقق من المفتاح السري
    if (!setup_key || setup_key !== process.env.ADMIN_SETUP_KEY) {
      return response.forbidden(res, 'مفتاح الإعداد غير صحيح');
    }

    // التحقق من المدخلات
    if (!full_name || !email || !password || !phone) {
      return response.badRequest(res, 'يرجى ملء جميع الحقول المطلوبة');
    }

    // التحقق من عدم وجود super_admin سابق
    const existingSuper = await pool.query(
      'SELECT user_id FROM users WHERE role = ? LIMIT 1',
      [USER_ROLES.SUPER_ADMIN]
    );

    if (existingSuper.length > 0) {
      return response.forbidden(res, 'تم إعداد Super Admin مسبقاً. استخدم لوحة التحكم لإضافة موظفين.');
    }

    // التحقق من عدم تكرار البريد أو الهاتف
    const emailCheck = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (emailCheck.length > 0) {
      return response.badRequest(res, 'البريد الإلكتروني مستخدم مسبقاً');
    }

    const phoneCheck = await pool.query('SELECT user_id FROM users WHERE phone = ?', [phone]);
    if (phoneCheck.length > 0) {
      return response.badRequest(res, 'رقم الهاتف مستخدم مسبقاً');
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء Super Admin
    const result = await pool.query(`
      INSERT INTO users (full_name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `, [full_name, email, hashedPassword, phone, USER_ROLES.SUPER_ADMIN]);

    return response.created(res, {
      user_id: result.insertId,
      full_name,
      email,
      phone,
      role: USER_ROLES.SUPER_ADMIN
    }, 'تم إنشاء Super Admin بنجاح. يمكنك الآن تسجيل الدخول.');

  } catch (error) {
    console.error('Setup Super Admin Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء إنشاء Super Admin');
  }
};

module.exports = {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  setupSuperAdmin
};
