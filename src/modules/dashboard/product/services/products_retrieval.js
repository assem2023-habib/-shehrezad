/**
 * Products Retrieval Service
 * خدمة استرجاع بيانات المنتجات
 */

const pool = require('../../../../config/dbconnect');
const { buildProductQuery, getProductCoupons } = require('./products_helpers');

const getAllProducts = async (filters = {}) => {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const { query: whereClause, params: whereParams } = buildProductQuery(filters);

    let query = `
    SELECT 
      p.product_id,
      p.product_code,
      p.product_name,
      p.product_category,
      p.price_usd,
      p.price_try,
      p.price_syp,
      p.availability_status,
      p.created_at,
      p.updated_at,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as main_image,
      (SELECT SUM(ps.quantity) FROM product_colors pc 
        JOIN product_sizes ps ON pc.color_id = ps.color_id 
        WHERE pc.product_id = p.product_id) as total_stock
    FROM products p
    ${whereClause}
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `;

    const params = [...whereParams, parseInt(limit), parseInt(offset)];
    const products = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;
    const totalResult = await pool.query(countQuery, whereParams);
    const total = totalResult[0].total;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const productsWithCoupons = await Promise.all(products.map(async (p) => {
        const coupons = await getProductCoupons(p.product_id, now);
        return {
            ...p,
            total_stock: parseInt(p.total_stock) || 0,
            coupons
        };
    }));

    return {
        products: productsWithCoupons,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

const getProductById = async (productId) => {
    const products = await pool.query(`
    SELECT * FROM products WHERE product_id = ?
  `, [productId]);

    if (!products.length) return null;

    const product = products[0];

    const images = await pool.query(
        'SELECT image_id, image_url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC',
        [productId]
    );

    const colors = await pool.query(
        'SELECT * FROM product_colors WHERE product_id = ?',
        [productId]
    );

    const colorsWithSizes = await Promise.all(colors.map(async (color) => {
        const sizes = await pool.query(
            'SELECT size_id, size_value, quantity FROM product_sizes WHERE color_id = ?',
            [color.color_id]
        );

        return {
            color_id: color.color_id,
            color_name: color.color_name,
            color_value: color.color_value,
            sizes: sizes.map(s => ({
                size_id: s.size_id,
                size_value: s.size_value,
                quantity: s.quantity
            }))
        };
    }));

    const reviewStats = await pool.query(`
    SELECT 
      COUNT(*) as review_count,
      AVG(rating) as average_rating,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews
    FROM reviews
    WHERE product_id = ?
  `, [productId]);

    const reviews = await pool.query(`
    SELECT 
      r.review_id,
      r.rating,
      r.comment,
      r.status,
      r.created_at,
      u.full_name as customer_name,
      u.customer_code,
      u.phone as customer_phone
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `, [productId]);

    const coupons = await pool.query(`
    SELECT 
      c.coupon_id,
      c.code,
      c.discount_type,
      c.discount_value,
      c.max_discount_amount,
      c.min_purchase_amount,
      c.usage_limit,
      c.used_count,
      c.start_date,
      c.end_date,
      c.target_audience,
      c.target_products_type
    FROM coupons c
    LEFT JOIN coupon_products cp ON c.coupon_id = cp.coupon_id
    WHERE c.status = 'active'
      AND (c.start_date IS NULL OR c.start_date <= NOW())
      AND (c.end_date IS NULL OR c.end_date >= NOW())
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
      AND (c.target_products_type = 'all' OR cp.product_id = ?)
  `, [productId]);

    return {
        ...product,
        images,
        colors: colorsWithSizes,
        review_statistics: {
            total_reviews: reviewStats[0].review_count || 0,
            average_rating: parseFloat(reviewStats[0].average_rating || 0).toFixed(1),
            pending_reviews: reviewStats[0].pending_reviews || 0,
            approved_reviews: reviewStats[0].approved_reviews || 0
        },
        reviews,
        coupons
    };
};

module.exports = {
    getAllProducts,
    getProductById
};
