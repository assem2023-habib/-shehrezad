/**
 * Dashboard Carts Controller - متحكم السلات للوحة التحكم
 */

const dashboardCartsService = require('../services/dashboard_carts_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع السلات الفعالة
 * GET /api/dashboard/carts
 */
const getAllCarts = async (req, res) => {
  try {
    const carts = await dashboardCartsService.getAllCarts();
    return response.success(res, carts);

  } catch (error) {
    console.error('Get All Carts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب السلات');
  }
};

/**
 * العرض الفوري - جميع العناصر المضافة
 * GET /api/dashboard/cart-items
 */
const getAllCartItems = async (req, res) => {
  try {
    const items = await dashboardCartsService.getAllCartItems();
    return response.success(res, items);

  } catch (error) {
    console.error('Get Cart Items Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب العناصر');
  }
};

/**
 * السلات الجاهزة للشحن (تجاوزت المدة)
 * GET /api/dashboard/carts/pending
 */
const getPendingCarts = async (req, res) => {
  try {
    const carts = await dashboardCartsService.getPendingCarts();
    return response.success(res, carts);

  } catch (error) {
    console.error('Get Pending Carts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب السلات');
  }
};

/**
 * تفاصيل سلة محددة
 * GET /api/dashboard/cart/:cart_id
 */
const getCartDetails = async (req, res) => {
  try {
    const { cart_id } = req.params;
    const result = await dashboardCartsService.getCartDetails(parseInt(cart_id));

    if (!result) {
      return response.notFound(res, 'السلة غير موجودة');
    }

    return response.success(res, result);

  } catch (error) {
    console.error('Get Cart Details Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل السلة');
  }
};

/**
 * تأكيد السلة بالكود وإنشاء طلب مع حساب الديون
 * POST /api/dashboard/carts/confirm
 * Body: { cart_code: 'CART-20241205-00001', paid_amount: 3000 }
 */
const confirmCartByCode = async (req, res) => {
  try {
    const { cart_code, paid_amount, coupon_code, shipping_address, payment_method } = req.body;
    const employeeId = req.user.user_id;

    if (!cart_code) {
      return response.badRequest(res, 'يرجى إدخال كود السلة');
    }

    const result = await dashboardCartsService.confirmCartByCode(cart_code, employeeId, paid_amount || 0, coupon_code, shipping_address, payment_method);
    return response.created(res, result, 'تم تأكيد السلة وإنشاء الطلب بنجاح');

  } catch (error) {
    console.error('Confirm Cart Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تأكيد السلة');
  }
};

module.exports = {
  getAllCarts,
  getAllCartItems,
  getPendingCarts,
  getCartDetails,
  confirmCartByCode
};
