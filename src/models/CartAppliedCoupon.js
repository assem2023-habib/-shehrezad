const db = require('../config/dbconnect');

class CartAppliedCoupon {
    static async create(couponData) {
        const { cart_id, item_id, coupon_id, user_id } = couponData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO cart_applied_coupons (cart_id, item_id, coupon_id, user_id) 
                   VALUES (?, ?, ?, ?)`;
            db.query(sql, [cart_id, item_id, coupon_id, user_id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_applied_coupons WHERE id = ?';
            db.query(sql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByCartId(cartId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_applied_coupons WHERE cart_id = ?';
            db.query(sql, [cartId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_applied_coupons WHERE user_id = ?';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_applied_coupons';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM cart_applied_coupons WHERE id = ?';
            db.query(sql, [id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = CartAppliedCoupon;
