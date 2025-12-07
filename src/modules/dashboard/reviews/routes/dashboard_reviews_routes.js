/**
 * Dashboard Reviews Routes - مسارات التقييمات للوحة التحكم
 */

const express = require('express');
const router = express.Router();
const dashboardReviewsController = require('../controllers/dashboard_reviews_controller');
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');

// جميع المسارات تتطلب توكن + مخولي الإدارة (Admin/Super Admin)
router.use(verifyToken);
router.use(checkRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]));

/**
 * @route   GET /api/dashboard/reviews/statistics
 * @desc    جلب إحصائيات التقييمات
 * @access  Private (Admin)
 */
router.get('/statistics', dashboardReviewsController.getReviewsStatistics);

/**
 * @route   GET /api/dashboard/reviews/pending
 * @desc    جلب التقييمات المعلقة
 * @access  Private (Admin)
 */
router.get('/pending', dashboardReviewsController.getPendingReviews);

router.get('/all', dashboardReviewsController.getAllReviewsAllStatuses);

/**
 * @route   GET /api/dashboard/reviews
 * @desc    جلب جميع التقييمات مع فلاتر
 * @access  Private (Admin)
 */
router.get('/', dashboardReviewsController.getAllReviews);

/**
 * @route   GET /api/dashboard/reviews/:review_id
 * @desc    جلب تفاصيل تقييم معين
 * @access  Private (Admin)
 */
router.get('/:review_id', dashboardReviewsController.getReviewDetails);

/**
 * @route   PUT /api/dashboard/reviews/:review_id/approve
 * @desc    الموافقة على تقييم
 * @access  Private (Admin)
 */
router.put('/:review_id/approve', dashboardReviewsController.approveReview);

/**
 * @route   PUT /api/dashboard/reviews/:review_id/reject
 * @desc    رفض تقييم
 * @access  Private (Admin)
 */
router.put('/:review_id/reject', dashboardReviewsController.rejectReview);

/**
 * @route   DELETE /api/dashboard/reviews/:review_id
 * @desc    حذف تقييم
 * @access  Private (Admin)
 */
router.delete('/:review_id', dashboardReviewsController.deleteReview);

module.exports = router;
