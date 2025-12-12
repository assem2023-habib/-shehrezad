/**
 * Customer Debts Routes
 * مسارات ديون العملاء
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middleware/authenticate_token');
const getDebtsSummaryController = require('../controllers/get_debts_summary_controller');
const getDebtsHistoryController = require('../controllers/get_debts_history_controller');
const getDebtDetailsController = require('../controllers/get_debt_details_controller');

// ملخص الديون - يجب تسجيل الدخول
router.get('/summary', authenticateToken, getDebtsSummaryController);

// سجل الديون - يجب تسجيل الدخول
router.get('/history', authenticateToken, getDebtsHistoryController);

// تفاصيل دين محدد - يجب تسجيل الدخول
router.get('/:debt_id', authenticateToken, getDebtDetailsController);

module.exports = router;
