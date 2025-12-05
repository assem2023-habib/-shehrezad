/**
 * Dashboard Coupon Controller
 */

const couponService = require('../services/coupon_service');
const response = require('../../../../config/response_helper');

/**
 * إنشاء كوبون
 */
const createCoupon = async (req, res) => {
  try {
    const { code, discount_type, discount_value } = req.body;

    if (!code || !discount_type || !discount_value) {
      return response.badRequest(res, 'يرجى إدخال البيانات الأساسية للكوبون');
    }

    const result = await couponService.createCoupon(req.body);
    return response.created(res, result, 'تم إنشاء الكوبون بنجاح');

  } catch (error) {
    console.error('Create Coupon Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return response.badRequest(res, 'كود الكوبون موجود مسبقاً');
    }
    return response.handleError(res, error, 'حدث خطأ أثناء إنشاء الكوبون');
  }
};

/**
 * جلب جميع الكوبونات
 */
const getAllCoupons = async (req, res) => {
  try {
    const result = await couponService.getAllCoupons();
    return response.success(res, result);
  } catch (error) {
    console.error('Get Coupons Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب الكوبونات');
  }
};

/**
 * جلب تفاصيل كوبون
 */
const getCouponById = async (req, res) => {
  try {
    const result = await couponService.getCouponById(req.params.id);
    if (!result) {
      return response.notFound(res, 'الكوبون غير موجود');
    }
    return response.success(res, result);
  } catch (error) {
    console.error('Get Coupon Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل الكوبون');
  }
};

/**
 * تغيير حالة الكوبون
 */
const toggleStatus = async (req, res) => {
  try {
    const result = await couponService.toggleStatus(req.params.id);
    return response.updated(res, result, 'تم تغيير حالة الكوبون');
  } catch (error) {
    console.error('Toggle Status Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تغيير الحالة');
  }
};

/**
 * حذف كوبون
 */
const deleteCoupon = async (req, res) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    return response.deleted(res, 'تم حذف الكوبون');
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء حذف الكوبون');
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  toggleStatus,
  deleteCoupon
};
