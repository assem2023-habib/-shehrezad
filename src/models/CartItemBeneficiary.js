const db = require('../config/dbconnect');

class CartItemBeneficiary {
    static async create(beneficiaryData) {
        const { item_id, beneficiary_name } = beneficiaryData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO cart_item_beneficiaries (item_id, beneficiary_name) 
                   VALUES (?, ?)`;
            db.query(sql, [item_id, beneficiary_name], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(beneficiaryId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_item_beneficiaries WHERE beneficiary_id = ?';
            db.query(sql, [beneficiaryId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByItemId(itemId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_item_beneficiaries WHERE item_id = ?';
            db.query(sql, [itemId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM cart_item_beneficiaries';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(beneficiaryId, beneficiaryData) {
        const { beneficiary_name } = beneficiaryData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE cart_item_beneficiaries SET beneficiary_name = ? WHERE beneficiary_id = ?`;
            db.query(sql, [beneficiary_name, beneficiaryId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(beneficiaryId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM cart_item_beneficiaries WHERE beneficiary_id = ?';
            db.query(sql, [beneficiaryId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = CartItemBeneficiary;
