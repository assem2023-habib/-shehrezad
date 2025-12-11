const db = require('../config/dbconnect');

class Coupon {
    static async create(couponData) {
        const { code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, status, target_audience, target_products_type } = couponData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, status, target_audience, target_products_type) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, status || 'active', target_audience || 'all', target_products_type || 'all'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(couponId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM coupons WHERE coupon_id = ?';
            db.query(sql, [couponId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByCode(code) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM coupons WHERE code = ?';
            db.query(sql, [code], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM coupons';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findActive() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM coupons WHERE status = "active"';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(couponId, couponData) {
        const { code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, used_count, status, target_audience, target_products_type } = couponData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_purchase_amount = ?, max_discount_amount = ?, start_date = ?, end_date = ?, usage_limit = ?, used_count = ?, status = ?, target_audience = ?, target_products_type = ? 
                   WHERE coupon_id = ?`;
            db.query(sql, [code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, used_count, status, target_audience, target_products_type, couponId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(couponId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM coupons WHERE coupon_id = ?';
            db.query(sql, [couponId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Coupon;
