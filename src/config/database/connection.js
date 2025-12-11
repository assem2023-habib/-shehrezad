require('dotenv').config();
const { createConnection } = require('mysql');

const connection = createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

const connect = () => {
    return new Promise((resolve, reject) => {
        connection.connect(err => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const disconnect = () => {
    connection.end();
};

module.exports = {
    connection,
    query,
    connect,
    disconnect
};
