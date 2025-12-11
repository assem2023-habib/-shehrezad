const db = require('../config/dbconnect');

class CustomerDebt {
    static async create(debtData) {
        const { user_id, order_id, description, amount, paid_amount, remaining, status, currency } = debtData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO customer_debts (user_id, order_id, description, amount, paid_amount, remaining, status, currency) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [user_id, order_id, description, amount, paid_amount || 0, remaining, status || 'pending', currency || 'TRY'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(debtId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM customer_debts WHERE debt_id = ?';
            db.query(sql, [debtId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM customer_debts WHERE user_id = ? ORDER BY created_at DESC';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM customer_debts WHERE order_id = ?';
            db.query(sql, [orderId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM customer_debts ORDER BY created_at DESC';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM customer_debts WHERE status = ? ORDER BY created_at DESC';
            db.query(sql, [status], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(debtId, debtData) {
        const { description, amount, paid_amount, remaining, status, currency } = debtData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE customer_debts SET description = ?, amount = ?, paid_amount = ?, remaining = ?, status = ?, currency = ? WHERE debt_id = ?`;
            db.query(sql, [description, amount, paid_amount, remaining, status, currency, debtId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(debtId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM customer_debts WHERE debt_id = ?';
            db.query(sql, [debtId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = CustomerDebt;
