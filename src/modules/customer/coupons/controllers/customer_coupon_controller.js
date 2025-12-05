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
  validateCoupon
};
