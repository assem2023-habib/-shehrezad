/**
 * Get Orders Controller
 * Controller لجلب جميع طلبات العميل
 */

const customerOrdersService = require('../services/customer_orders_service');
const { HTTP_STATUS } = require('../../../../config/constants');

const getOrders = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { status, search, page, limit } = req.query;

        const result = await customerOrdersService.getMyOrders(userId, {
            status,
            search,
            page,
            limit
        });

        res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
        console.error('Get Customer Orders Error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            error: 'حدث خطأ أثناء جلب الطلبات'
        });
    }
};

module.exports = getOrders;
