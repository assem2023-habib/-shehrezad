/**
 * Dashboard Coupon Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const couponController = require('../controllers/coupon_controller');

// حماية المسارات (super_admin فقط للكوبونات)
router.use(verifyToken);
router.use(checkRole(['super_admin']));

// المسارات
router.post('/', couponController.createCoupon);
router.get('/', couponController.getAllCoupons);
router.get('/:id', couponController.getCouponById);
router.put('/:id', couponController.updateCoupon);
router.put('/:id/status', couponController.toggleStatus);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
