/**
 * Dashboard Get Products Controller
 */

const dashboardProductsService = require('../services/dashboard_products_service');
const response = require('../../../../config/response_helper');

/**
 * جلب المنتجات للوحة التحكم
 * GET /api/dashboard/products
 */
const getProducts = async (req, res) => {
  try {
    const { category, search, page, limit, availability_status } = req.query;

    const result = await dashboardProductsService.getAllProducts({
      category,
      search,
      page,
      limit,
      availability_status
    });

    return response.success(res, result);

  } catch (error) {
    console.error('Dashboard Get Products Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب المنتجات');
  }
};

module.exports = { getProducts };
