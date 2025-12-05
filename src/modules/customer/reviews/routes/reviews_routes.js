/**
 * Customer Reviews Routes - مسارات التقييمات للعملاء
 */

const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviews_controller');
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');

// جميع المسارات تتطلب تسجيل دخول العميل
router.use(verifyToken);
router.use(checkRole([USER_ROLES.CUSTOMER]));

/**
 * @route   POST /api/reviews
 * @desc    إضافة تقييم جديد
 * @access  Private (Customer)
 */
router.post('/', reviewsController.addReview);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    جلب تقييمات العميل
 * @access  Private (Customer)
 */
router.get('/my-reviews', reviewsController.getMyReviews);

/**
 * @route   GET /api/reviews/can-review/:product_id
 * @desc    التحقق من إمكانية تقييم منتج
 * @access  Private (Customer)
 */
router.get('/can-review/:product_id', reviewsController.canReviewProduct);

/**
 * @route   GET /api/reviews/product/:product_id
 * @desc    جلب تقييمات منتج (عامة - لكن محمية)
 * @access  Private (Customer)
 */
router.get('/product/:product_id', reviewsController.getProductReviews);

/**
 * @route   PUT /api/reviews/:review_id
 * @desc    تحديث تقييم
 * @access  Private (Customer)
 */
router.put('/:review_id', reviewsController.updateReview);

/**
 * @route   DELETE /api/reviews/:review_id
 * @desc    حذف تقييم
 * @access  Private (Customer)
 */
router.delete('/:review_id', reviewsController.deleteReview);

module.exports = router;
