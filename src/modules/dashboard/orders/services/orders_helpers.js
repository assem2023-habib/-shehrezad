/**
 * Orders Helper Functions
 * دوال مساعدة لإدارة الطلبات
 */

const pool = require('../../../../config/dbconnect');
const { ORDER_STATUS } = require('../../../../config/constants');

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
    createQuery,
    ORDER_STATUS
};
