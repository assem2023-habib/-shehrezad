/**
 * Get Debts History Controller
 * Controller لجلب سجل ديون العميل
 */

const customerDebtsService = require('../services/customer_debts_service');
const { HTTP_STATUS } = require('../../../../config/constants');

const getDebtsHistory = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { status, currency, page, limit } = req.query;

        const result = await customerDebtsService.getMyDebtsHistory(userId, {
            status,
            currency,
            page,
            limit
        });

        res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.error('Get Debts History Error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            error: 'حدث خطأ أثناء جلب سجل الديون'
        });
    }
};

module.exports = getDebtsHistory;
