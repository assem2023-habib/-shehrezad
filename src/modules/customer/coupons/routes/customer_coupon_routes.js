/**
 * Customer Coupon Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const customerCouponController = require('../controllers/customer_coupon_controller');

// حماية المسارات (Customer Only)
router.use(verifyToken);
router.use(checkRole(['customer']));

// التحقق من الكوبون
router.post('/validate', customerCouponController.validateCoupon);

// جلب الكوبونات المسندة للعميل
router.get('/assigned', customerCouponController.getAssignedCoupons);

// جلب كوبونات المنتجات للمستخدم (اختياري product_id)
router.get('/products', customerCouponController.getProductCouponsForUser);

// جلب الكوبونات القابلة للتطبيق على سلة المستخدم
router.get('/cart-applicable', customerCouponController.getCartApplicableCoupons);

module.exports = router;
