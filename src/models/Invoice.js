const db = require('../config/dbconnect');

class Invoice {
    static async create(invoiceData) {
        const { order_id, invoice_number, issue_date, due_date, status, total_amount } = invoiceData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO invoices (order_id, invoice_number, issue_date, due_date, status, total_amount) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(sql, [order_id, invoice_number, issue_date, due_date, status || 'unpaid', total_amount], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(invoiceId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM invoices WHERE invoice_id = ?';
            db.query(sql, [invoiceId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM invoices WHERE order_id = ?';
            db.query(sql, [orderId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByInvoiceNumber(invoiceNumber) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM invoices WHERE invoice_number = ?';
            db.query(sql, [invoiceNumber], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM invoices ORDER BY issue_date DESC';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM invoices WHERE status = ? ORDER BY issue_date DESC';
            db.query(sql, [status], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(invoiceId, invoiceData) {
        const { invoice_number, issue_date, due_date, status, total_amount } = invoiceData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE invoices SET invoice_number = ?, issue_date = ?, due_date = ?, status = ?, total_amount = ? WHERE invoice_id = ?`;
            db.query(sql, [invoice_number, issue_date, due_date, status, total_amount, invoiceId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(invoiceId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM invoices WHERE invoice_id = ?';
            db.query(sql, [invoiceId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Invoice;
