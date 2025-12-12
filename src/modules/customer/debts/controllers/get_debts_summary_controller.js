/**
 * Get Debts Summary Controller
 * Controller لجلب ملخص ديون العميل
 */

const customerDebtsService = require('../services/customer_debts_service');
const { HTTP_STATUS } = require('../../../../config/constants');

const getDebtsSummary = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const summary = await customerDebtsService.getMyDebtsSummary(userId);
        res.status(HTTP_STATUS.OK).json(summary);
    } catch (error) {
        console.error('Get Debts Summary Error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            error: 'حدث خطأ أثناء جلب ملخص الديون'
        });
    }
};

module.exports = getDebtsSummary;
