/**
 * Dashboard Reviews Controller - متحكم التقييمات للوحة التحكم
 */

const dashboardReviewsService = require('../services/dashboard_reviews_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع التقييمات مع فلاتر
 * GET /api/dashboard/reviews
 */
const getAllReviews = async (req, res) => {
    try {
        const { status, product_id, page, limit } = req.query;

        const result = await dashboardReviewsService.getAllReviews({
            status,
            product_id,
            page,
            limit
        });

        return response.success(res, result);

    } catch (error) {
        console.error('Get All Reviews Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب التقييمات');
    }
};

const getAllReviewsAllStatuses = async (req, res) => {
    try {
        const { product_id, page, limit } = req.query;

        const result = await dashboardReviewsService.getAllReviews({
            product_id,
            page,
            limit
        });

        return response.success(res, result);

    } catch (error) {
        console.error('Get All Reviews (All Statuses) Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب كل التقييمات');
    }
};

/**
 * جلب التقييمات المعلقة
 * GET /api/dashboard/reviews/pending
 */
const getPendingReviews = async (req, res) => {
    try {
        const reviews = await dashboardReviewsService.getPendingReviews();
        return response.success(res, reviews);

    } catch (error) {
        console.error('Get Pending Reviews Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب التقييمات المعلقة');
    }
};

/**
 * الموافقة على تقييم
 * PUT /api/dashboard/reviews/:review_id/approve
 */
const approveReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const id = parseInt(review_id, 10);
        if (Number.isNaN(id)) {
            return response.badRequest(res, 'معرف التقييم غير صالح');
        }

        const result = await dashboardReviewsService.approveReview(id);

        return response.updated(res, result, 'تم الموافقة على التقييم');

    } catch (error) {
        console.error('Approve Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء الموافقة على التقييم');
    }
};

/**
 * رفض تقييم
 * PUT /api/dashboard/reviews/:review_id/reject
 */
const rejectReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const id = parseInt(review_id, 10);
        if (Number.isNaN(id)) {
            return response.badRequest(res, 'معرف التقييم غير صالح');
        }

        const result = await dashboardReviewsService.rejectReview(id);

        return response.updated(res, result, 'تم رفض التقييم');

    } catch (error) {
        console.error('Reject Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء رفض التقييم');
    }
};

/**
 * حذف تقييم
 * DELETE /api/dashboard/reviews/:review_id
 */
const deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const id = parseInt(review_id, 10);
        if (Number.isNaN(id)) {
            return response.badRequest(res, 'معرف التقييم غير صالح');
        }

        await dashboardReviewsService.deleteReview(id);

        return response.deleted(res, 'تم حذف التقييم بنجاح');

    } catch (error) {
        console.error('Delete Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء حذف التقييم');
    }
};

/**
 * جلب إحصائيات التقييمات
 * GET /api/dashboard/reviews/statistics
 */
const getReviewsStatistics = async (req, res) => {
    try {
        const stats = await dashboardReviewsService.getReviewsStatistics();
        return response.success(res, stats);

    } catch (error) {
        console.error('Get Reviews Statistics Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب الإحصائيات');
    }
};

/**
 * جلب تفاصيل تقييم معين
 * GET /api/dashboard/reviews/:review_id
 */
const getReviewDetails = async (req, res) => {
    try {
        const { review_id } = req.params;
        const id = parseInt(review_id, 10);
        if (Number.isNaN(id)) {
            return response.badRequest(res, 'معرف التقييم غير صالح');
        }

        const review = await dashboardReviewsService.getReviewDetails(id);

        if (!review) {
            return response.notFound(res, 'التقييم غير موجود');
        }

        return response.success(res, review);

    } catch (error) {
        console.error('Get Review Details Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل التقييم');
    }
};

module.exports = {
    getAllReviews,
    getAllReviewsAllStatuses,
    getPendingReviews,
    approveReview,
    rejectReview,
    deleteReview,
    getReviewsStatistics,
    getReviewDetails
};
