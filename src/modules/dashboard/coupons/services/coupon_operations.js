/**
 * Coupon Operations Service
 * العمليات الأساسية على الكوبونات
 */

const pool = require('../../../../config/dbconnect');
const { getConnection, createQuery } = require('./coupon_helpers');

const createCoupon = async (couponData) => {
    const {
        code,
        discount_type,
        discount_value,
        min_purchase_amount = 0,
        max_discount_amount = null,
        start_date = null,
        end_date = null,
        usage_limit = null,
        target_audience = 'all',
        target_products_type = 'all',
        customer_ids = [],
        product_ids = []
    } = couponData;

    const connection = await getConnection();
    const query = createQuery(connection);

    try {
        await query('START TRANSACTION');

        const result = await query(`
      INSERT INTO coupons (
        code, discount_type, discount_value, min_purchase_amount, 
        max_discount_amount, start_date, end_date, usage_limit, 
        target_audience, target_products_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            code, discount_type, discount_value, min_purchase_amount,
            max_discount_amount, start_date, end_date, usage_limit,
            target_audience, target_products_type
        ]);

        const couponId = result.insertId;

        if (target_audience === 'specific_users' && customer_ids.length > 0) {
            const customerValues = customer_ids.map(id => [couponId, id]);
            await query(
                'INSERT INTO coupon_customers (coupon_id, user_id) VALUES ?',
                [customerValues]
            );
        }

        if (target_products_type === 'specific_products' && product_ids.length > 0) {
            const productValues = product_ids.map(id => [couponId, id]);
            await query(
                'INSERT INTO coupon_products (coupon_id, product_id) VALUES ?',
                [productValues]
            );
        }

        await query('COMMIT');
        return { coupon_id: couponId, ...couponData };

    } catch (error) {
        await query('ROLLBACK');
        throw error;
    } finally {
        connection.release();
    }
};

const toggleStatus = async (couponId) => {
    const coupon = await pool.query('SELECT status FROM coupons WHERE coupon_id = ?', [couponId]);
    if (!coupon.length) throw new Error('الكوبون غير موجود');

    const newStatus = coupon[0].status === 'active' ? 'inactive' : 'active';
    await pool.query('UPDATE coupons SET status = ? WHERE coupon_id = ?', [newStatus, couponId]);

    return { coupon_id: couponId, status: newStatus };
};

const deleteCoupon = async (couponId) => {
    await pool.query('DELETE FROM coupons WHERE coupon_id = ?', [couponId]);
    return true;
};

module.exports = {
    createCoupon,
    toggleStatus,
    deleteCoupon
};
