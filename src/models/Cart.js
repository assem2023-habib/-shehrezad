const db = require('../config/dbconnect');

class Cart {
    static async create(cartData) {
        const { user_id, cart_code, status } = cartData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO carts (user_id, cart_code, status) VALUES (?, ?, ?)`;
            db.query(sql, [user_id, cart_code, status || 'active'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(cartId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM carts WHERE cart_id = ?';
            db.query(sql, [cartId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM carts WHERE user_id = ?';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findActiveByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM carts WHERE user_id = ? AND status = "active"';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByCode(cartCode) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM carts WHERE cart_code = ?';
            db.query(sql, [cartCode], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM carts';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(cartId, cartData) {
        const { status, reminder_sent } = cartData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE carts SET status = ?, reminder_sent = ? WHERE cart_id = ?`;
            db.query(sql, [status, reminder_sent, cartId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(cartId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM carts WHERE cart_id = ?';
            db.query(sql, [cartId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Cart;
