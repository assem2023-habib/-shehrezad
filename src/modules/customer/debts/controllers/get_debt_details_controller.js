/**
 * Get Debt Details Controller
 * Controller لجلب تفاصيل دين محدد
 */

const customerDebtsService = require('../services/customer_debts_service');
const { HTTP_STATUS } = require('../../../../config/constants');

const getDebtDetails = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { debt_id } = req.params;

        const debt = await customerDebtsService.getMyDebtById(userId, parseInt(debt_id));

        if (!debt) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'الدين غير موجود'
            });
        }

        res.status(HTTP_STATUS.OK).json(debt);
    } catch (error) {
        console.error('Get Debt Details Error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            error: 'حدث خطأ أثناء جلب تفاصيل الدين'
        });
    }
};

module.exports = getDebtDetails;
