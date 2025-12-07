/**
 * Dashboard Orders Controller
 */

const dashboardOrdersService = require('../services/dashboard_orders_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع الطلبات
 * GET /api/dashboard/orders
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    const result = await dashboardOrdersService.getAllOrders({ status, search, page, limit });
    return response.success(res, result);
  } catch (error) {
    console.error('Get Orders Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب الطلبات');
  }
};

/**
 * جلب تفاصيل طلب
 * GET /api/dashboard/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await dashboardOrdersService.getOrderById(id);

    if (!order) {
      return response.notFound(res, 'الطلب غير موجود');
    }

    return response.success(res, order);
  } catch (error) {
    console.error('Get Order Details Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل الطلب');
  }
};

/**
 * تحديث حالة الطلب
 * PUT /api/dashboard/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return response.badRequest(res, 'يرجى تحديد الحالة الجديدة');
    }

    const result = await dashboardOrdersService.updateOrderStatus(id, status);
    return response.success(res, result, 'تم تحديث حالة الطلب بنجاح');

  } catch (error) {
    console.error('Update Order Status Error:', error);
    return response.badRequest(res, error.message);
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus
};
