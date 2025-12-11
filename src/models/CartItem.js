const db = require('../config/dbconnect');

class CartItem {
    static async create(itemData) {
        const { cart_id, product_id, color_id, size_id, quantity } = itemData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO cart_items (cart_id, product_id, color_id, size_id, quantity) 
                   VALUES (?, ?, ?, ?, ?)`;
            db.query(sql, [cart_id, product_id, color_id, size_id, quantity || 1], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_items WHERE item_id = ?';
            db.query(sql, [itemId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByCartId(cartId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_items WHERE cart_id = ?';
            db.query(sql, [cartId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_items';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(itemId, itemData) {
        const { quantity, is_locked, stock_deducted } = itemData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE cart_items SET quantity = ?, is_locked = ?, stock_deducted = ? WHERE item_id = ?`;
            db.query(sql, [quantity, is_locked, stock_deducted, itemId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM cart_items WHERE item_id = ?';
            db.query(sql, [itemId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = CartItem;
