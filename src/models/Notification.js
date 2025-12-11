const db = require('../config/dbconnect');

class Notification {
    static async create(notificationData) {
        const { user_id, title, body, type } = notificationData;
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO notifications (user_id, title, body, type) 
                   VALUES (?, ?, ?, ?)`;
            db.query(sql, [user_id, title, body, type || 'general'], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async findById(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM notifications WHERE notification_id = ?';
            db.query(sql, [notificationId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });
    }

    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findUnreadByUserId(userId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC';
            db.query(sql, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM notifications ORDER BY created_at DESC';
            db.query(sql, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });
    }

    static async update(notificationId, notificationData) {
        const { title, body, type, is_read } = notificationData;
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET title = ?, body = ?, type = ?, is_read = ? WHERE notification_id = ?`;
            db.query(sql, [title, body, type, is_read, notificationId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async markAsRead(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = `UPDATE notifications SET is_read = 1 WHERE notification_id = ?`;
            db.query(sql, [notificationId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    static async delete(notificationId) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM notifications WHERE notification_id = ?';
            db.query(sql, [notificationId], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }
}

module.exports = Notification;
