const db = require('../config/dbconnect');

class ProductImage {
    static async create(imageData) {
        const { product_id, image_url, public_id, is_main } = imageData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO product_images (product_id, image_url, public_id, is_main) 
                   VALUES (?, ?, ?, ?)`;
            db.query(sql, [product_id, image_url, public_id, is_main || 0], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(imageId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_images WHERE image_id = ?';
            db.query(sql, [imageId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_images WHERE product_id = ?';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findMainByProductId(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_images WHERE product_id = ? AND is_main = 1 LIMIT 1';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM product_images';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(imageId, imageData) {
        const { image_url, public_id, is_main } = imageData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE product_images SET image_url = ?, public_id = ?, is_main = ? WHERE image_id = ?`;
            db.query(sql, [image_url, public_id, is_main, imageId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(imageId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM product_images WHERE image_id = ?';
            db.query(sql, [imageId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = ProductImage;
