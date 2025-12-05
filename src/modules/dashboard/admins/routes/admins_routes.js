/**
 * Dashboard Employees Routes
 * مسارات إدارة الموظفين في لوحة التحكم
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const employeeController = require('../../../auth/controllers/admin_controller');

// جميع المسارات تتطلب توكن + super_admin
router.use(verifyToken);
router.use(checkRole([USER_ROLES.SUPER_ADMIN]));

// إنشاء موظف جديد
router.post('/', employeeController.createEmployee);

// جلب جميع الموظفين
router.get('/', employeeController.getAllEmployees);

// جلب موظف واحد
router.get('/:id', employeeController.getEmployeeById);

// تحديث بيانات موظف
router.put('/:id', employeeController.updateEmployee);

// حذف موظف
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
