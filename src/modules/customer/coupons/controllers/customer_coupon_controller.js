/**
 * Customer Coupon Controller
 */

const customerCouponService = require('../services/customer_coupon_service');
const cartService = require('../../cart/services/cart_service');
const response = require('../../../../config/response_helper');

/**
 * التحقق من الكوبون
 * POST /api/coupons/validate
 */
const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user.user_id;

    if (!code) {
      return response.badRequest(res, 'يرجى إدخال كود الكوبون');
    }

    // جلب تفاصيل السلة لحساب المجموع والتحقق من المنتجات
    const cartData = await cartService.getCart(userId);
    
    if (!cartData.cart || cartData.items.length === 0) {
      return response.badRequest(res, 'السلة فارغة');
    }

    // حساب إجمالي السلة (بالليرة التركية كمثال)
    const totalAmount = cartData.items.reduce((sum, item) => sum + (item.price_try * item.quantity), 0);

    const result = await customerCouponService.validateCoupon(
      code,
      userId,
      totalAmount,
      cartData.items
    );

    return response.success(res, result, 'الكوبون صالح');

  } catch (error) {
    console.error('Validate Coupon Error:', error);
    return response.badRequest(res, error.message);
  }
};

module.exports = {
  validateCoupon,
  getAssignedCoupons: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const coupons = await customerCouponService.getAssignedCoupons(userId);
      return response.success(res, coupons);
    } catch (error) {
      console.error('Get Assigned Coupons Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء جلب الكوبونات');
    }
  },
  getProductCouponsForUser: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const { product_id } = req.query;
      const pid = product_id ? parseInt(product_id) : null;
      const coupons = await customerCouponService.getProductCouponsForUser(userId, pid);
      return response.success(res, coupons);
    } catch (error) {
      console.error('Get Product Coupons Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء جلب كوبونات المنتجات');
    }
  },
  getCartApplicableCoupons: async (req, res) => {
    try {
      const userId = req.user.user_id;
      const coupons = await customerCouponService.getCartApplicableCoupons(userId);
      return response.success(res, coupons);
    } catch (error) {
      console.error('Get Cart Applicable Coupons Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء جلب كوبونات السلة');
    }
  }
};
