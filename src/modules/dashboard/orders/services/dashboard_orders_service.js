/**
 * Dashboard Orders Service - خدمة الطلبات للوحة التحكم
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const ordersOperations = require('./orders_operations');
const ordersRetrieval = require('./orders_retrieval');

module.exports = {
  getAllOrders: ordersRetrieval.getAllOrders,
  getOrderById: ordersRetrieval.getOrderById,
  updateOrderStatus: ordersOperations.updateOrderStatus,
  restoreStock: ordersOperations.restoreStock,
  searchOrders: ordersRetrieval.searchOrders,
  getOrderItemDetails: ordersRetrieval.getOrderItemDetails
};
