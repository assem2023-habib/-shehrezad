const db = require('../config/dbconnect');

class ProductColor {
    static async create(colorData) {
        const { product_id, color_name, color_value } = colorData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO product_colors (product_id, color_name, color_value) 
                   VALUES (?, ?, ?)`;
            db.query(sql, [product_id, color_name, color_value], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(colorId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_colors WHERE color_id = ?';
            db.query(sql, [colorId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_colors WHERE product_id = ?';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_colors';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(colorId, colorData) {
        const { color_name, color_value } = colorData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE product_colors SET color_name = ?, color_value = ? WHERE color_id = ?`;
            db.query(sql, [color_name, color_value, colorId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(colorId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM product_colors WHERE color_id = ?';
            db.query(sql, [colorId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = ProductColor;
