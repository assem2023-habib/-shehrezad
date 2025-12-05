/**
 * Dashboard Reviews Service - خدمة التقييمات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');
const { REVIEW_STATUS, HTTP_STATUS } = require('../../../../config/constants');

/**
 * جلب جميع التقييمات مع خيارات الفلترة
 */
const getAllReviews = async (filters = {}) => {
    const { status, product_id, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = `
    SELECT 
      r.*,
      p.product_name,
      p.product_code,
      u.full_name as customer_name,
      u.customer_code,
      u.phone as customer_phone
    FROM reviews r
    JOIN products p ON r.product_id = p.product_id
    JOIN users u ON r.user_id = u.user_id
    WHERE 1=1
  `;

    const params = [];

    if (status && Object.values(REVIEW_STATUS).includes(status)) {
        query += ' AND r.status = ?';
        params.push(status);
    }

    if (product_id) {
        query += ' AND r.product_id = ?';
        params.push(parseInt(product_id));
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const reviews = await pool.query(query, params);

    // حساب العدد الكلي
    let countQuery = 'SELECT COUNT(*) as total FROM reviews r WHERE 1=1';
    const countParams = [];

    if (status && Object.values(REVIEW_STATUS).includes(status)) {
        countQuery += ' AND r.status = ?';
        countParams.push(status);
    }

    if (product_id) {
        countQuery += ' AND r.product_id = ?';
        countParams.push(parseInt(product_id));
    }

    const totalResult = await pool.query(countQuery, countParams);

    return {
        reviews,
        pagination: {
            total: totalResult[0].total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(totalResult[0].total / parseInt(limit))
        }
    };
};

/**
 * جلب التقييمات المعلقة (بحاجة للمراجعة)
 */
const getPendingReviews = async () => {
    const reviews = await pool.query(`
    SELECT 
      r.*,
      p.product_name,
      p.product_code,
      u.full_name as customer_name,
      u.customer_code,
      u.phone as customer_phone
    FROM reviews r
    JOIN products p ON r.product_id = p.product_id
    JOIN users u ON r.user_id = u.user_id
    WHERE r.status = ?
    ORDER BY r.created_at ASC
  `, [REVIEW_STATUS.PENDING]);

    return reviews;
};

/**
 * الموافقة على تقييم
 */
const approveReview = async (reviewId) => {
    const review = await pool.query(
        'SELECT review_id, status FROM reviews WHERE review_id = ?',
        [reviewId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    await pool.query(
        'UPDATE reviews SET status = ? WHERE review_id = ?',
        [REVIEW_STATUS.APPROVED, reviewId]
    );

    return {
        review_id: reviewId,
        status: REVIEW_STATUS.APPROVED
    };
};

/**
 * رفض تقييم
 */
const rejectReview = async (reviewId) => {
    const review = await pool.query(
        'SELECT review_id, status FROM reviews WHERE review_id = ?',
        [reviewId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    await pool.query(
        'UPDATE reviews SET status = ? WHERE review_id = ?',
        [REVIEW_STATUS.REJECTED, reviewId]
    );

    return {
        review_id: reviewId,
        status: REVIEW_STATUS.REJECTED
    };
};

/**
 * حذف تقييم (إدارياً)
 */
const deleteReview = async (reviewId) => {
    const review = await pool.query(
        'SELECT review_id FROM reviews WHERE review_id = ?',
        [reviewId]
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
 * جلب إحصائيات التقييمات
 */
const getReviewsStatistics = async () => {
    const stats = await pool.query(`
    SELECT 
      COUNT(*) as total_reviews,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_reviews,
      AVG(CASE WHEN status = 'approved' THEN rating ELSE NULL END) as average_rating
    FROM reviews
  `);

    const ratingDistribution = await pool.query(`
    SELECT 
      rating,
      COUNT(*) as count
    FROM reviews
    WHERE status = 'approved'
    GROUP BY rating
    ORDER BY rating DESC
  `);

    const topRatedProducts = await pool.query(`
    SELECT 
      p.product_id,
      p.product_name,
      p.product_code,
      COUNT(r.review_id) as review_count,
      AVG(r.rating) as average_rating
    FROM products p
    LEFT JOIN reviews r ON p.product_id = r.product_id AND r.status = 'approved'
    GROUP BY p.product_id
    HAVING review_count > 0
    ORDER BY average_rating DESC, review_count DESC
    LIMIT 10
  `);

    return {
        overview: {
            total_reviews: stats[0].total_reviews,
            pending_reviews: stats[0].pending_reviews,
            approved_reviews: stats[0].approved_reviews,
            rejected_reviews: stats[0].rejected_reviews,
            average_rating: parseFloat(stats[0].average_rating || 0).toFixed(2)
        },
        rating_distribution: ratingDistribution,
        top_rated_products: topRatedProducts.map(p => ({
            ...p,
            average_rating: parseFloat(p.average_rating).toFixed(1)
        }))
    };
};

/**
 * جلب تفاصيل تقييم معين
 */
const getReviewDetails = async (reviewId) => {
    const review = await pool.query(`
    SELECT 
      r.*,
      p.product_name,
      p.product_code,
      p.product_id,
      u.full_name as customer_name,
      u.customer_code,
      u.phone as customer_phone,
      u.email as customer_email,
      o.order_id,
      o.created_at as order_date
    FROM reviews r
    JOIN products p ON r.product_id = p.product_id
    JOIN users u ON r.user_id = u.user_id
    JOIN orders o ON r.order_id = o.order_id
    WHERE r.review_id = ?
  `, [reviewId]);

    if (!review.length) {
        return null;
    }

    return review[0];
};

module.exports = {
    getAllReviews,
    getPendingReviews,
    approveReview,
    rejectReview,
    deleteReview,
    getReviewsStatistics,
    getReviewDetails
};
