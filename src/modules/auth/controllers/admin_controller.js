/**
 * Employee Management Controller
 * إدارة حسابات الموظفين - للـ Super Admin فقط
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const response = require('../../../config/response_helper');
const { USER_ROLES } = require('../../../config/constants');
const adminOperations = require('../services/admin_operations');
const adminRetrieval = require('../services/admin_retrieval');

const createEmployee = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع إنشاء موظفين');
    }

    const { full_name, email, password, phone } = req.body;
    const result = await adminOperations.createEmployee(full_name, email, password, phone);
    return response.created(res, result, 'تم إنشاء الموظف بنجاح');

  } catch (error) {
    console.error('Create Employee Error:', error);
    if (error.message.includes('مستخدم') || error.message.includes('الحقول')) {
      return response.badRequest(res, error.message);
    }
    return response.serverError(res, 'حدث خطأ أثناء إنشاء الموظف');
  }
};

const getAllEmployees = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع عرض قائمة الموظفين');
    }

    const employees = await adminRetrieval.getAllEmployees();
    return response.success(res, employees);

  } catch (error) {
    console.error('Get Employees Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب قائمة الموظفين');
  }
};

const getEmployeeById = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع عرض بيانات الموظف');
    }

    const { id } = req.params;
    const employee = await adminRetrieval.getEmployeeById(id);
    return response.success(res, employee);

  } catch (error) {
    console.error('Get Employee Error:', error);
    if (error.message.includes('موجود')) {
      return response.notFound(res, error.message);
    }
    return response.serverError(res, 'حدث خطأ أثناء جلب بيانات الموظف');
  }
};

const updateEmployee = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع تعديل بيانات الموظفين');
    }

    const { id } = req.params;
    await adminOperations.updateEmployee(id, req.body);
    return response.success(res, null, 'تم تحديث بيانات الموظف بنجاح');

  } catch (error) {
    console.error('Update Employee Error:', error);
    if (error.message.includes('موجود') || error.message.includes('مستخدم') || error.message.includes('التحديث')) {
      return response.badRequest(res, error.message);
    }
    return response.serverError(res, 'حدث خطأ أثناء تحديث بيانات الموظف');
  }
};

const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return response.forbidden(res, 'فقط Super Admin يستطيع حذف الموظفين');
    }

    const { id } = req.params;
    await adminOperations.deleteEmployee(id);
    return response.deleted(res, 'تم حذف الموظف بنجاح');

  } catch (error) {
    console.error('Delete Employee Error:', error);
    if (error.message.includes('موجود')) {
      return response.notFound(res, error.message);
    }
    return response.serverError(res, 'حدث خطأ أثناء حذف الموظف');
  }
};

const setupSuperAdmin = async (req, res) => {
  try {
    const { setup_key, full_name, email, password, phone } = req.body;
    const result = await adminOperations.setupSuperAdmin(setup_key, full_name, email, password, phone);
    return response.created(res, result, 'تم إنشاء Super Admin بنجاح. يمكنك الآن تسجيل الدخول.');

  } catch (error) {
    console.error('Setup Super Admin Error:', error);
    if (error.message.includes('مفتاح') || error.message.includes('مسبقاً') || error.message.includes('الحقول')) {
      return response.forbidden(res, error.message);
    }
    if (error.message.includes('مستخدم')) {
      return response.badRequest(res, error.message);
    }
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
