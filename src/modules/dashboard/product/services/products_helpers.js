/**
 * Products Helper Functions
 * دوال مساعدة لإدارة المنتجات
 */

const pool = require('../../../../config/dbconnect');
const { PRODUCT_CATEGORIES } = require('../../../../config/constants');

const buildProductQuery = (filters = {}) => {
    const { category, search, availability_status } = filters;
    let query = 'WHERE 1=1';
    const params = [];

    if (availability_status) {
        query += ' AND p.availability_status = ?';
        params.push(availability_status);
    }

    if (category && Object.values(PRODUCT_CATEGORIES).includes(category)) {
        query += ' AND p.product_category = ?';
        params.push(category);
    }

    if (search) {
        query += ' AND (p.product_name LIKE ? OR p.product_code LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    return { query, params };
};

const getProductCoupons = async (productId, now) => {
    return await pool.query(`
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
      AND (c.start_date IS NULL OR c.start_date <= ?)
      AND (c.end_date IS NULL OR c.end_date >= ?)
      AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
      AND (c.target_products_type = 'all' OR cp.product_id = ?)
  `, [now, now, productId]);
};

module.exports = {
    buildProductQuery,
    getProductCoupons,
    PRODUCT_CATEGORIES
};
