/**
 * Customer Reviews Service - خدمة التقييمات للعملاء
 */

const pool = require('../../../../config/dbconnect');
const { REVIEW_STATUS, ORDER_STATUS, HTTP_STATUS } = require('../../../../config/constants');

/**
 * إضافة تقييم جديد للمنتج
 * أي مستخدم مسجل يمكنه تقييم أي منتج
 */
const addReview = async (userId, reviewData) => {
    const { product_id, rating, comment } = reviewData;

    // التحقق من صحة التقييم (1-5)
    if (rating < 1 || rating > 5) {
        const error = new Error('التقييم يجب أن يكون من 1 إلى 5');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // التحقق من عدم وجود تقييم سابق لنفس المستخدم والمنتج
    const existingReview = await pool.query(
        'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, product_id]
    );

    if (existingReview.length > 0) {
        const error = new Error('لقد قمت بتقييم هذا المنتج مسبقاً');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // إضافة التقييم بدون طلب مطلوب
    const result = await pool.query(`
    INSERT INTO reviews (product_id, user_id, rating, comment, status)
    VALUES (?, ?, ?, ?, ?)
  `, [product_id, userId, rating, comment || null, REVIEW_STATUS.APPROVED]);

    return {
        review_id: result.insertId,
        product_id,
        user_id: userId,
        rating,
        comment: comment || null,
        status: REVIEW_STATUS.APPROVED
    };
};

/**
 * جلب تقييمات منتج معين (المعتمدة فقط)
 */
const getProductReviews = async (productId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const reviews = await pool.query(`
    SELECT 
      r.review_id,
      r.rating,
      r.comment,
      r.created_at,
      u.full_name as customer_name,
      u.customer_code
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = ? AND r.status = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `, [productId, REVIEW_STATUS.APPROVED, parseInt(limit), parseInt(offset)]);

    // حساب عدد التقييمات ومتوسط التقييم
    const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(rating) as average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
    FROM reviews
    WHERE product_id = ? AND status = ?
  `, [productId, REVIEW_STATUS.APPROVED]);

    return {
        reviews,
        statistics: {
            total_reviews: stats[0].total_reviews,
            average_rating: parseFloat(stats[0].average_rating || 0).toFixed(1),
            rating_distribution: {
                five_stars: stats[0].five_stars || 0,
                four_stars: stats[0].four_stars || 0,
                three_stars: stats[0].three_stars || 0,
                two_stars: stats[0].two_stars || 0,
                one_star: stats[0].one_star || 0
            }
        },
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: stats[0].total_reviews
        }
    };
};

/**
 * جلب تقييمات العميل
 */
const getMyReviews = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;

    const reviews = await pool.query(`
    SELECT 
      r.review_id,
      r.product_id,
      r.order_id,
      r.rating,
      r.comment,
      r.status,
      r.created_at,
      p.product_name,
      p.product_code
    FROM reviews r
    JOIN products p ON r.product_id = p.product_id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(limit), parseInt(offset)]);

    const total = await pool.query(
        'SELECT COUNT(*) as count FROM reviews WHERE user_id = ?',
        [userId]
    );

    return {
        reviews,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: total[0].count
        }
    };
};

/**
 * تحديث تقييم
 * يمكن للعميل تعديل تقييمه في أي وقت
 */
const updateReview = async (userId, reviewId, updateData) => {
    const { rating, comment } = updateData;

    // التحقق من أن التقييم يخص المستخدم
    const review = await pool.query(
        'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    if (rating && (rating < 1 || rating > 5)) {
        const error = new Error('التقييم يجب أن يكون من 1 إلى 5');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // تحديث التقييم
    await pool.query(
        'UPDATE reviews SET rating = ?, comment = ?, updated_at = NOW() WHERE review_id = ?',
        [rating || review[0].rating, comment !== undefined ? comment : review[0].comment, reviewId]
    );

    return {
        review_id: reviewId,
        rating: rating || review[0].rating,
        comment: comment !== undefined ? comment : review[0].comment,
        status: review[0].status,
        updated_at: new Date()
    };
};

/**
 * حذف تقييم
 * يمكن للعميل حذف تقييمه في أي وقت
 */
const deleteReview = async (userId, reviewId) => {
    const review = await pool.query(
        'SELECT review_id FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
    return true;
};

/**
 * التحقق من إمكانية تقييم المنتج
 * أي مستخدم مسجل يمكنه تقييم أي منتج
 */
const canReviewProduct = async (userId, productId) => {
    // التحقق من وجود تقييم سابق
    const existingReview = await pool.query(
        'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );

    if (existingReview.length > 0) {
        return {
            can_review: false,
            reason: 'لقد قمت بتقييم هذا المنتج مسبقاً'
        };
    }

    return {
        can_review: true,
        reason: null
    };
};

module.exports = {
    addReview,
    getProductReviews,
    getMyReviews,
    updateReview,
    deleteReview,
    canReviewProduct
};
