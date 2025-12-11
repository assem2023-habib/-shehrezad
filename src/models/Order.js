const db = require('../config/dbconnect');

class Order {
    static async create(orderData) {
        const { user_id, total_amount, status, shipping_address, payment_method, coupon_id, discount_amount, confirmed_by, customer_note, cart_note, currency } = orderData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method, coupon_id, discount_amount, confirmed_by, customer_note, cart_note, currency) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [user_id, total_amount, status || 'unpaid', shipping_address, payment_method || 'cod', coupon_id, discount_amount || 0, confirmed_by, customer_note, cart_note, currency || 'TRY'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(orderId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM orders WHERE order_id = ?';
            db.query(sql, [orderId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC';
            db.query(sql, [status], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(orderId, orderData) {
        const { total_amount, status, shipping_address, payment_method, coupon_id, discount_amount, confirmed_by, customer_note, cart_note, currency } = orderData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE orders SET total_amount = ?, status = ?, shipping_address = ?, payment_method = ?, coupon_id = ?, discount_amount = ?, confirmed_by = ?, customer_note = ?, cart_note = ?, currency = ? 
                   WHERE order_id = ?`;
            db.query(sql, [total_amount, status, shipping_address, payment_method, coupon_id, discount_amount, confirmed_by, customer_note, cart_note, currency, orderId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(orderId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM orders WHERE order_id = ?';
            db.query(sql, [orderId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Order;
