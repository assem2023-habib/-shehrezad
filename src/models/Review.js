const db = require('../config/dbconnect');

class Review {
    static async create(reviewData) {
        const { product_id, user_id, order_id, rating, comment, status } = reviewData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO reviews (product_id, user_id, order_id, rating, comment, status) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(sql, [product_id, user_id, order_id, rating, comment, status || 'pending'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(reviewId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM reviews WHERE review_id = ?';
            db.query(sql, [reviewId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM reviews WHERE product_id = ? AND status = "approved"';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM reviews WHERE user_id = ?';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM reviews';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM reviews WHERE status = ?';
            db.query(sql, [status], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(reviewId, reviewData) {
        const { rating, comment, status } = reviewData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE reviews SET rating = ?, comment = ?, status = ? WHERE review_id = ?`;
            db.query(sql, [rating, comment, status, reviewId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(reviewId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM reviews WHERE review_id = ?';
            db.query(sql, [reviewId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Review;
