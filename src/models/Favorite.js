const db = require('../config/dbconnect');

class Favorite {
    static async create(favoriteData) {
        const { user_id, product_id } = favoriteData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO favorites (user_id, product_id) VALUES (?, ?)`;
            db.query(sql, [user_id, product_id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(favoriteId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM favorites WHERE favorite_id = ?';
            db.query(sql, [favoriteId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM favorites WHERE user_id = ?';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM favorites WHERE product_id = ?';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM favorites';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async delete(favoriteId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM favorites WHERE favorite_id = ?';
            db.query(sql, [favoriteId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async deleteByUserAndProduct(userId, productId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM favorites WHERE user_id = ? AND product_id = ?';
            db.query(sql, [userId, productId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Favorite;
