/**
 * Customer Reviews Service - خدمة التقييمات للعملاء
 */

const pool = require('../../../../config/dbconnect');
const { REVIEW_STATUS, ORDER_STATUS, HTTP_STATUS } = require('../../../../config/constants');

/**
 * إضافة تقييم جديد للمنتج
 * يمكن للعميل تقييم المنتج فقط إذا اشتراه
 */
const addReview = async (userId, reviewData) => {
    const { product_id, order_id, rating, comment } = reviewData;

    // التحقق من صحة التقييم (1-5)
    if (rating < 1 || rating > 5) {
        const error = new Error('التقييم يجب أن يكون من 1 إلى 5');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // التحقق من أن العميل اشترى هذا المنتج
    const purchaseCheck = await pool.query(`
    SELECT oi.item_id, o.status
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND oi.order_id = ?
  `, [userId, product_id, order_id]);

    if (!purchaseCheck.length) {
        const error = new Error('لا يمكنك تقييم منتج لم تشتريه');
        error.status = HTTP_STATUS.FORBIDDEN;
        throw error;
    }

    // التحقق من عدم وجود تقييم سابق لنفس المنتج والطلب
    const existingReview = await pool.query(
        'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
        [userId, product_id, order_id]
    );

    if (existingReview.length > 0) {
        const error = new Error('لقد قمت بتقييم هذا المنتج مسبقاً');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // إضافة التقييم
    const result = await pool.query(`
    INSERT INTO reviews (product_id, user_id, order_id, rating, comment, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [product_id, userId, order_id, rating, comment || null, REVIEW_STATUS.PENDING]);

    return {
        review_id: result.insertId,
        product_id,
        user_id: userId,
        order_id,
        rating,
        comment: comment || null,
        status: REVIEW_STATUS.PENDING
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
 * تحديث تقييم (قبل الموافقة عليه فقط)
 */
const updateReview = async (userId, reviewId, updateData) => {
    const { rating, comment } = updateData;

    // التحقق من أن التقييم يخص المستخدم وأنه لم يتم الموافقة عليه بعد
    const review = await pool.query(
        'SELECT * FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    if (review[0].status !== REVIEW_STATUS.PENDING) {
        const error = new Error('لا يمكن تعديل تقييم تم مراجعته');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    if (rating && (rating < 1 || rating > 5)) {
        const error = new Error('التقييم يجب أن يكون من 1 إلى 5');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    // تحديث التقييم
    await pool.query(
        'UPDATE reviews SET rating = ?, comment = ? WHERE review_id = ?',
        [rating || review[0].rating, comment || review[0].comment, reviewId]
    );

    return {
        review_id: reviewId,
        rating: rating || review[0].rating,
        comment: comment || review[0].comment,
        status: REVIEW_STATUS.PENDING
    };
};

/**
 * حذف تقييم (قبل الموافقة عليه فقط)
 */
const deleteReview = async (userId, reviewId) => {
    const review = await pool.query(
        'SELECT status FROM reviews WHERE review_id = ? AND user_id = ?',
        [reviewId, userId]
    );

    if (!review.length) {
        const error = new Error('التقييم غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    if (review[0].status !== REVIEW_STATUS.PENDING) {
        const error = new Error('لا يمكن حذف تقييم تم مراجعته');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
    return true;
};

/**
 * التحقق من إمكانية تقييم المنتج
 */
const canReviewProduct = async (userId, productId) => {
    // التحقق من أن العميل اشترى المنتج
    const purchases = await pool.query(`
    SELECT DISTINCT oi.order_id, o.created_at as order_date
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('completed', 'shipped', 'delivered')
    ORDER BY o.created_at DESC
  `, [userId, productId]);

    if (!purchases.length) {
        return {
            can_review: false,
            reason: 'لم تقم بشراء هذا المنتج بعد'
        };
    }

    // التحقق من التقييمات الموجودة
    const existingReviews = await pool.query(
        'SELECT order_id FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
    );

    const reviewedOrderIds = existingReviews.map(r => r.order_id);
    const availableOrders = purchases.filter(p => !reviewedOrderIds.includes(p.order_id));

    return {
        can_review: availableOrders.length > 0,
        available_orders: availableOrders,
        reason: availableOrders.length === 0 ? 'لقد قمت بتقييم جميع طلباتك لهذا المنتج' : null
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
