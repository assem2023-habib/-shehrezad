/**
 * Customer Reviews Controller - متحكم التقييمات للعملاء
 */

const reviewsService = require('../services/reviews_service');
const response = require('../../../../config/response_helper');

/**
 * إضافة تقييم جديد
 * POST /api/reviews
 */
const addReview = async (req, res) => {
    try {
        const { product_id, rating, comment } = req.body;

        if (!product_id || !rating) {
            return response.badRequest(res, 'يرجى تحديد المنتج والتقييم');
        }

        const review = await reviewsService.addReview(req.user.user_id, {
            product_id,
            rating,
            comment
        });

        return response.created(res, review, 'تم إضافة التقييم بنجاح');

    } catch (error) {
        console.error('Add Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء إضافة التقييم');
    }
};

/**
 * جلب تقييمات منتج
 * GET /api/reviews/product/:product_id
 */
const getProductReviews = async (req, res) => {
    try {
        const { product_id } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const result = await reviewsService.getProductReviews(
            parseInt(product_id),
            parseInt(page),
            parseInt(limit)
        );

        return response.success(res, result);

    } catch (error) {
        console.error('Get Product Reviews Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب التقييمات');
    }
};

/**
 * جلب تقييمات العميل
 * GET /api/reviews/my-reviews
 */
const getMyReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const result = await reviewsService.getMyReviews(
            req.user.user_id,
            parseInt(page),
            parseInt(limit)
        );

        return response.success(res, result);

    } catch (error) {
        console.error('Get My Reviews Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء جلب تقييماتك');
    }
};

/**
 * تحديث تقييم
 * PUT /api/reviews/:review_id
 */
const updateReview = async (req, res) => {
    try {
        const { review_id } = req.params;
        const { rating, comment } = req.body;

        const review = await reviewsService.updateReview(
            req.user.user_id,
            parseInt(review_id),
            { rating, comment }
        );

        return response.updated(res, review, 'تم تحديث التقييم بنجاح');

    } catch (error) {
        console.error('Update Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء تحديث التقييم');
    }
};

/**
 * حذف تقييم
 * DELETE /api/reviews/:review_id
 */
const deleteReview = async (req, res) => {
    try {
        const { review_id } = req.params;

        await reviewsService.deleteReview(req.user.user_id, parseInt(review_id));

        return response.deleted(res, 'تم حذف التقييم بنجاح');

    } catch (error) {
        console.error('Delete Review Error:', error);
        return response.handleError(res, error, 'حدث خطأ أثناء حذف التقييم');
    }
};

/**
 * التحقق من إمكانية تقييم منتج
 * GET /api/reviews/can-review/:product_id
 */
const canReviewProduct = async (req, res) => {
    try {
        const { product_id } = req.params;

        const result = await reviewsService.canReviewProduct(
            req.user.user_id,
            parseInt(product_id)
        );

        return response.success(res, result);

    } catch (error) {
        console.error('Can Review Product Error:', error);
        return response.serverError(res, 'حدث خطأ أثناء التحقق');
    }
};

module.exports = {
    addReview,
    getProductReviews,
    getMyReviews,
    updateReview,
    deleteReview,
    canReviewProduct
};
