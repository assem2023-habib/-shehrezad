/**
 * Get Order Details Controller
 * Controller لجلب تفاصيل طلب محدد للعميل
 */

const customerOrdersService = require('../services/customer_orders_service');
const { HTTP_STATUS } = require('../../../../config/constants');

const getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { order_id } = req.params;

        const order = await customerOrdersService.getMyOrderById(userId, parseInt(order_id));

        if (!order) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'الطلب غير موجود'
            });
        }

        res.status(HTTP_STATUS.OK).json(order);
    } catch (error) {
        console.error('Get Order Details Error:', error);
        res.status(HTTP_STATUS.SERVER_ERROR).json({
            error: 'حدث خطأ أثناء جلب تفاصيل الطلب'
        });
    }
};

module.exports = getOrderDetails;
