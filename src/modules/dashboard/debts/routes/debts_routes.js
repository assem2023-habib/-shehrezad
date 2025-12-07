/**
 * Debts Routes - مسارات ديون العملاء
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const debtsController = require('../controllers/debts_controller');

// جميع المسارات تتطلب توكن + employee أو super_admin
router.use(verifyToken);
router.use(checkRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]));

// جميع العملاء المديونين
router.get('/', debtsController.getAllCustomersWithDebts);

// سجل ديون عميل محدد
router.get('/:user_id', debtsController.getCustomerDebts);

// تسجيل دفعة على رصيد العميل
router.post('/payment', debtsController.recordPayment);

// تسجيل دفعة على دين محدد
router.post('/:debt_id/payment', debtsController.recordPaymentToDebt);

module.exports = router;
