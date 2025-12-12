/**
 * Customer Debts Routes
 * مسارات ديون العملاء
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middleware/verifytoken');
const getDebtsSummaryController = require('../controllers/get_debts_summary_controller');
const getDebtsHistoryController = require('../controllers/get_debts_history_controller');
const getDebtDetailsController = require('../controllers/get_debt_details_controller');

router.use(verifyToken);

// ملخص الديون - يجب تسجيل الدخول
router.get('/summary', getDebtsSummaryController);

// سجل الديون - يجب تسجيل الدخول
router.get('/history', getDebtsHistoryController);

// تفاصيل دين محدد - يجب تسجيل الدخول
router.get('/:debt_id', getDebtDetailsController);

module.exports = router;
