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

module.exports = router;
