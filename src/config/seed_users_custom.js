/**
 * Seeder - إضافة مستخدمين sama و haider
 * 
 * تشغيل: node src/config/seed_users_custom.js
 */

require('dotenv').config();
const mysql = require('mysql');
const bcrypt = require('bcrypt');

// إنشاء اتصال
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'shehrezad',
    multipleStatements: true
});

// تحويل query إلى Promise
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

async function seedUsers() {
    await new Promise((resolve, reject) => {
        connection.connect(err => {
            if (err) reject(err);
            else resolve();
        });
    });
    // ============================
    // 1. تشفير كلمة السر
    // ============================
    const userPassword = await bcrypt.hash('user123', 10);

    // قائمة المستخدمين
    const users = [
        {
            name: 'sama',
            email: 'sama@example.com',
            role: 'customer',
            phone: '0501111111',
            code: 'CUST1001'
        },
        {
            name: 'haider',
            email: 'haider@example.com',
            role: 'customer',
            phone: '0502222222',
            code: 'CUST1002'
        }
    ];

    for (const user of users) {
        await query(
            `
        INSERT INTO users (full_name, email, password, role, phone, customer_code)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
        `,
            [user.name, user.email, userPassword, user.role, user.phone, user.code]
        );
    }
}

seedUsers();
