/**
 * Coupon Retrieval Service
 * خدمة استرجاع بيانات الكوبونات
 */

const pool = require('../../../../config/dbconnect');

const getAllCoupons = async (filters = {}) => {
    let sql = 'SELECT * FROM coupons ORDER BY created_at DESC';
    const coupons = await pool.query(sql);
    return coupons;
};

const getCouponById = async (couponId) => {
    const coupons = await pool.query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
    if (!coupons.length) return null;

    const coupon = coupons[0];

    if (coupon.target_audience === 'specific_users') {
        coupon.customers = await pool.query(`
      SELECT u.user_id, u.full_name, u.email 
      FROM coupon_customers cc
      JOIN users u ON cc.user_id = u.user_id
      WHERE cc.coupon_id = ?
    `, [couponId]);
    }

    if (coupon.target_products_type === 'specific_products') {
        coupon.products = await pool.query(`
      SELECT p.product_id, p.product_name, p.product_code
      FROM coupon_products cp
      JOIN products p ON cp.product_id = p.product_id
      WHERE cp.coupon_id = ?
    `, [couponId]);
    }

    return coupon;
};

module.exports = {
    getAllCoupons,
    getCouponById
};
