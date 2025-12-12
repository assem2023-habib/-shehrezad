/**
 * Database Seeder - Main Index
 * بذر البيانات التجريبية
 * 
 * تشغيل: node src/config/seeder.js
 */

require('dotenv').config();
const mysql = require('mysql');

const { seedUsers } = require('./seed_users');
const { seedProducts } = require('./seed_products');
const { seedProductImages } = require('./seed_product_images');
const { seedProductColors } = require('./seed_product_colors');
const { seedProductSizes } = require('./seed_product_sizes');
const { seedCoupons } = require('./seed_coupons');
const { seedOrders } = require('./seed_orders');
const { seedReviews } = require('./seed_reviews');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'shehrezad',
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

async function seedDatabase() {
    try {
        console.log('🔌 Connecting to database...');

        await new Promise((resolve, reject) => {
            connection.connect(err => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Connected!\n');

        // 1. Seed Users
        const userIds = await seedUsers(query);

        // 2. Seed Products
        await seedProducts(query);

        // 3. Seed Product Images
        await seedProductImages(query);

        // 4. Seed Product Colors
        await seedProductColors(query);

        // 5. Seed Product Sizes
        await seedProductSizes(query);

        // 6. Seed Coupons
        await seedCoupons(query);

        // 7. Seed Orders
        const orderId = await seedOrders(query, userIds);

        // 8. Seed Reviews
        await seedReviews(query, userIds, orderId);

        // ==========================================
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📋 بيانات الدخول التجريبية:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 مدير النظام:');
        console.log('   البريد: admin@shehrezad.com');
        console.log('   كلمة المرور: admin123');
        console.log('');
        console.log('👤 عميل تجريبي:');
        console.log('   البريد: ahmad@example.com');
        console.log('   كلمة المرور: customer123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        connection.end();
        console.log('\n🔌 Connection closed');
    }
}

module.exports = { seedDatabase };
