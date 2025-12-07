require('dotenv').config();
const mysql = require('mysql');
const util = require('util');

// إنشاء Connection Pool
const pool = mysql.createPool({
  connectionLimit: Number(process.env.DB_CONN_LIMIT) || 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// تحويل pool.query إلى Promise لدعم async/await
pool.query = util.promisify(pool.query).bind(pool);

// تحويل pool.getConnection إلى Promise لدعم async/await
pool.getConnectionAsync = () =>
  new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) return reject(err);
      // تحويل connection.query إلى Promise أيضًا
      connection.queryAsync = util.promisify(connection.query).bind(connection);
      resolve(connection);
    });
  });

// اختبار الاتصال عند بدء التشغيل
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err.message);
  } else {
    console.log('MySQL pool created, connection OK');
    connection.release();
  }
});

// دعم إغلاق نظيف عند إيقاف السيرفر
const shutdown = () => {
  console.log('Closing DB pool...');
  pool.end(err => {
    if (err) console.error('Error closing DB pool:', err);
    else console.log('DB pool closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);   // Ctrl+C
process.on('SIGTERM', shutdown);  // Termination signal

module.exports = pool;


