const db = require('../config/dbconnect');

class User {
    static async create(userData) {
        const { full_name, email, password, role, phone, customer_code, invoice_image } = userData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (full_name, email, password, role, phone, customer_code, invoice_image) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [full_name, email, password, role, phone, customer_code, invoice_image], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE user_id = ?';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE email = ?';
            db.query(sql, [email], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByPhone(phone) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE phone = ?';
            db.query(sql, [phone], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByRole(role) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE role = ?';
            db.query(sql, [role], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(userId, userData) {
        const { full_name, email, password, phone, customer_code, invoice_image } = userData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET full_name = ?, email = ?, password = ?, phone = ?, customer_code = ?, invoice_image = ? 
                   WHERE user_id = ?`;
            db.query(sql, [full_name, email, password, phone, customer_code, invoice_image, userId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM users WHERE user_id = ?';
            db.query(sql, [userId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = User;
