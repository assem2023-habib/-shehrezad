/**
 * Products Controller - متحكم المنتجات للعميل
 */

const productsService = require('../services/products_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع المنتجات
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const { category, search, page, limit } = req.query;

    const products = await productsService.getAllProducts({
      category,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });

    return response.success(res, products);

  } catch (error) {
    console.error('Get Products Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب المنتجات');
  }
};

/**
 * جلب تفاصيل منتج
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productsService.getProductById(parseInt(id));

    if (!product) {
      return response.notFound(res, 'المنتج غير موجود');
    }

    return response.success(res, product);

  } catch (error) {
    console.error('Get Product Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب المنتج');
  }
};

/**
 * جلب منتجات حسب التصنيف
 * GET /api/products/category/:category
 */
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page, limit } = req.query;

    const products = await productsService.getProductsByCategory(
      category,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    return response.success(res, products);

  } catch (error) {
    console.error('Get Products by Category Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب المنتجات');
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory
};
