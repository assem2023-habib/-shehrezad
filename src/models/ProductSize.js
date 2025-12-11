const db = require('../config/dbconnect');

class ProductSize {
    static async create(sizeData) {
        const { color_id, size_value, quantity } = sizeData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO product_sizes (color_id, size_value, quantity) 
                   VALUES (?, ?, ?)`;
            db.query(sql, [color_id, size_value, quantity || 0], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(sizeId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_sizes WHERE size_id = ?';
            db.query(sql, [sizeId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByColorId(colorId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_sizes WHERE color_id = ?';
            db.query(sql, [colorId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_sizes';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(sizeId, sizeData) {
        const { size_value, quantity } = sizeData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE product_sizes SET size_value = ?, quantity = ? WHERE size_id = ?`;
            db.query(sql, [size_value, quantity, sizeId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(sizeId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM product_sizes WHERE size_id = ?';
            db.query(sql, [sizeId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = ProductSize;
