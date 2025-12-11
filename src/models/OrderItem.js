const db = require('../config/dbconnect');

class OrderItem {
    static async create(itemData) {
        const { order_id, product_id, color_id, size_id, quantity, price_at_purchase } = itemData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(sql, [order_id, product_id, color_id, size_id, quantity, price_at_purchase], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM order_items WHERE item_id = ?';
            db.query(sql, [itemId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM order_items WHERE order_id = ?';
            db.query(sql, [orderId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM order_items';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(itemId, itemData) {
        const { quantity, price_at_purchase } = itemData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE order_items SET quantity = ?, price_at_purchase = ? WHERE item_id = ?`;
            db.query(sql, [quantity, price_at_purchase, itemId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM order_items WHERE item_id = ?';
            db.query(sql, [itemId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = OrderItem;
