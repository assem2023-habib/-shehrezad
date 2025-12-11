/**
 * Dashboard Coupon Service
 * خدمة إدارة الكوبونات للوحة التحكم
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const couponOperations = require('./coupon_operations');
const couponRetrieval = require('./coupon_retrieval');
const couponUpdate = require('./coupon_update');

module.exports = {
  createCoupon: couponOperations.createCoupon,
  toggleStatus: couponOperations.toggleStatus,
  deleteCoupon: couponOperations.deleteCoupon,
  getAllCoupons: couponRetrieval.getAllCoupons,
  getCouponById: couponRetrieval.getCouponById,
  updateCoupon: couponUpdate.updateCoupon
};
