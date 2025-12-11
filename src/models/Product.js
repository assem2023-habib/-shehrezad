const db = require('../config/dbconnect');

class Product {
    static async create(productData) {
        const { product_code, product_name, product_description, product_category, price_usd, price_try, price_syp, token } = productData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO products (product_code, product_name, product_description, product_category, price_usd, price_try, price_syp, token) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            db.query(sql, [product_code, product_name, product_description, product_category, price_usd, price_try, price_syp, token], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE product_id = ?';
            db.query(sql, [productId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByCode(productCode) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE product_code = ?';
            db.query(sql, [productCode], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByToken(token) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE token = ?';
            db.query(sql, [token], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByCategory(category) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE product_category = ?';
            db.query(sql, [category], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findVisible() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM products WHERE availability_status = "visible" AND is_show = 1';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(productId, productData) {
        const { product_name, product_description, product_category, price_usd, price_try, price_syp, availability_status, is_show, token } = productData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE products SET product_name = ?, product_description = ?, product_category = ?, price_usd = ?, price_try = ?, price_syp = ?, availability_status = ?, is_show = ?, token = ? 
                   WHERE product_id = ?`;
            db.query(sql, [product_name, product_description, product_category, price_usd, price_try, price_syp, availability_status, is_show, token, productId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(productId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM products WHERE product_id = ?';
            db.query(sql, [productId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Product;
