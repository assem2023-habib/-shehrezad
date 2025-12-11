/**
 * Coupon Helper Functions
 * دوال مساعدة لإدارة الكوبونات
 */

const pool = require('../../../../config/dbconnect');

const getConnection = async () => {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, conn) => {
            if (err) reject(err);
            else resolve(conn);
        });
    });
};

const createQuery = (connection) => {
    return (sql, params) => {
        return new Promise((resolve, reject) => {
            connection.query(sql, params, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
    };
};

module.exports = {
    getConnection,
    createQuery
};
