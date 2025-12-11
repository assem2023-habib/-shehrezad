/**
 * Coupon Update Service
 * خدمة تحديث الكوبونات
 */

const pool = require('../../../../config/dbconnect');
const { getConnection, createQuery } = require('./coupon_helpers');

const updateCoupon = async (couponId, data) => {
    const connection = await getConnection();
    const query = createQuery(connection);

    try {
        await query('START TRANSACTION');

        const existingRows = await query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
        if (!existingRows.length) {
            throw new Error('الكوبون غير موجود');
        }

        const existing = existingRows[0];

        const allowedFields = [
            'code',
            'discount_type',
            'discount_value',
            'min_purchase_amount',
            'max_discount_amount',
            'start_date',
            'end_date',
            'usage_limit',
            'target_audience',
            'target_products_type',
            'status'
        ];

        const setParts = [];
        const params = [];
        for (const f of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(data, f)) {
                setParts.push(`${f} = ?`);
                params.push(data[f]);
            }
        }

        if (setParts.length) {
            await query(`UPDATE coupons SET ${setParts.join(', ')} WHERE coupon_id = ?`, [...params, couponId]);
        }

        const audience = Object.prototype.hasOwnProperty.call(data, 'target_audience') ? data.target_audience : existing.target_audience;
        const productsType = Object.prototype.hasOwnProperty.call(data, 'target_products_type') ? data.target_products_type : existing.target_products_type;

        if (audience === 'specific_users') {
            if (Array.isArray(data.customer_ids)) {
                await query('DELETE FROM coupon_customers WHERE coupon_id = ?', [couponId]);
                if (data.customer_ids.length) {
                    const values = data.customer_ids.map(id => [couponId, id]);
                    await query('INSERT INTO coupon_customers (coupon_id, user_id) VALUES ?', [values]);
                }
            }
        } else {
            await query('DELETE FROM coupon_customers WHERE coupon_id = ?', [couponId]);
        }

        if (productsType === 'specific_products') {
            if (Array.isArray(data.product_ids)) {
                await query('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
                if (data.product_ids.length) {
                    const values = data.product_ids.map(id => [couponId, id]);
                    await query('INSERT INTO coupon_products (coupon_id, product_id) VALUES ?', [values]);
                }
            }
        } else {
            await query('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
        }

        await query('COMMIT');

        const updated = await query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
        const coupon = updated[0];

        if (coupon.target_audience === 'specific_users') {
            coupon.customers = await query(
                'SELECT u.user_id, u.full_name, u.email FROM coupon_customers cc JOIN users u ON cc.user_id = u.user_id WHERE cc.coupon_id = ?',
                [couponId]
            );
        }

        if (coupon.target_products_type === 'specific_products') {
            coupon.products = await query(
                'SELECT p.product_id, p.product_name, p.product_code FROM coupon_products cp JOIN products p ON cp.product_id = p.product_id WHERE cp.coupon_id = ?',
                [couponId]
            );
        }

        return coupon;

    } catch (error) {
        await query('ROLLBACK');
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    updateCoupon
};
