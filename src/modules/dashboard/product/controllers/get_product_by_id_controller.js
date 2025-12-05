/**
 * Dashboard Get Product By ID Controller
 */

const dashboardProductsService = require('../services/dashboard_products_service');
const response = require('../../../../config/response_helper');

/**
 * جلب تفاصيل منتج للوحة التحكم
 * GET /api/dashboard/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await dashboardProductsService.getProductById(parseInt(id));

    if (!product) {
      return response.notFound(res, 'المنتج غير موجود');
    }

    return response.success(res, product);

  } catch (error) {
    console.error('Dashboard Get Product By ID Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل المنتج');
  }
};

module.exports = { getProductById };
