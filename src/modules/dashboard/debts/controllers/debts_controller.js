/**
 * Debts Controller - متحكم ديون العملاء
 */

const debtsService = require('../services/debts_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع العملاء المديونين
 * GET /api/dashboard/debts
 */
const getAllCustomersWithDebts = async (req, res) => {
  try {
    const customers = await debtsService.getAllCustomersWithDebts();
    return response.success(res, customers);
  } catch (error) {
    console.error('Get Customers With Debts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب البيانات');
  }
};

/**
 * جلب سجل ديون عميل محدد
 * GET /api/dashboard/debts/:user_id
 */
const getCustomerDebts = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await debtsService.getDebtHistory(parseInt(user_id));
    return response.success(res, result);
  } catch (error) {
    console.error('Get Customer Debts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب سجل الديون');
  }
};

/**
 * تسجيل دفعة على رصيد العميل
 * POST /api/dashboard/debts/payment
 * Body: { user_id: 1, amount: 500 }
 */
const recordPayment = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount) {
      return response.badRequest(res, 'يرجى إدخال رقم العميل والمبلغ');
    }

    if (parseFloat(amount) <= 0) {
      return response.badRequest(res, 'المبلغ يجب أن يكون أكبر من صفر');
    }

    const result = await debtsService.recordPaymentToBalance(user_id, amount);
    return response.success(res, result, 'تم تسجيل الدفعة بنجاح');
  } catch (error) {
    console.error('Record Payment Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تسجيل الدفعة');
  }
};

/**
 * تسجيل دفعة على دين محدد
 * POST /api/dashboard/debts/:debt_id/payment
 */
const recordPaymentToDebt = async (req, res) => {
  try {
    const { debt_id } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return response.badRequest(res, 'يرجى إدخال المبلغ');
    }

    const result = await debtsService.recordPayment(parseInt(debt_id), amount);
    return response.success(res, result, 'تم تسجيل الدفعة بنجاح');
  } catch (error) {
    console.error('Record Payment To Debt Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تسجيل الدفعة');
  }
};

module.exports = {
  getAllCustomersWithDebts,
  getCustomerDebts,
  recordPayment,
  recordPaymentToDebt
};
