/**
 * Seeder - إضافة مستخدمين sama و haider
 * تشغيل: node src/config/seed_users_custom.js
 */

require('dotenv').config();
const mysql = require('mysql');
const bcrypt = require('bcrypt');

// إنشاء اتصال
const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "assem",
    password: "Assem2025@@",
    database: "shehrezad",
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
    try {
        console.log("🔌 Connecting to database...");

        await new Promise((resolve, reject) => {
            connection.connect(err => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log("✅ Connected!\n");

        // ============================
        // 1. تشفير كلمة السر
        // ============================
        const userPassword = await bcrypt.hash('password', 10);

        // قائمة المستخدمين
        const users = [
            {
                name: 'sama',
                email: 'sama@cust.com',
                role: 'customer',
                phone: '0501111',
                code: 'Sama1'
            },
            {
                name: 'haider',
                email: 'haider@cust.com',
                role: 'customer',
                phone: '0502222',
                code: 'Haider1'
            }
        ];

        console.log("👥 Seeding users... Customer");

        for (const user of users) {
            await query(
                `
                INSERT INTO users (full_name, email, password, role, phone, customer_code)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)
                `,
                [user.name, user.email, userPassword, user.role, user.phone, user.code]
            );

            console.log(`✅ Inserted: ${user.name}`);
        }

        console.log("\n🎉 DONE! Users inserted successfully.");

    } catch (err) {
        console.error("❌ ERROR:", err);
    } finally {
        connection.end();
        console.log("🔌 Connection closed");
    }
}

seedUsers();
