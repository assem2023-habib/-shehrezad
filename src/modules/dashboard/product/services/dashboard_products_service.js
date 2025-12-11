/**
 * Dashboard Products Service - خدمة المنتجات للوحة التحكم
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const productsRetrieval = require('./products_retrieval');

module.exports = {
  getAllProducts: productsRetrieval.getAllProducts,
  getProductById: productsRetrieval.getProductById
};
