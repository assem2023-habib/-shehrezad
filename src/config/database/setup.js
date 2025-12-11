const { connect, disconnect, query } = require('./connection');
const {
    createUsersTables,
    createProductsTables,
    createSettingsTables,
    createCartTables,
    createNotificationsTables,
    createOrdersTables,
    createReviewsAndFavoriteTables,
    createCouponsTables,
    createDebtsTables
} = require('./tables');
const { runAllMigrations } = require('./migrations');

async function setupDatabase() {
    try {
        console.log('🔌 Connecting to MySQL...');

        await connect();
        console.log('✅ Connected to MySQL');

        // إنشاء القاعدة
        await query(`
      CREATE DATABASE IF NOT EXISTS shehrezad
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);
        console.log("✅ Database 'shehrezad' created or already exists");

        // اختيار القاعدة
        await query("USE shehrezad");
        console.log("✅ Using database 'shehrezad'");

        // إنشاء جميع الجداول
        await createUsersTables();
        await createProductsTables();
        await createSettingsTables();
        await createCartTables();
        await createNotificationsTables();
        await createOrdersTables();
        await createReviewsAndFavoriteTables();
        await createCouponsTables();
        await createDebtsTables();

        // تطبيق جميع الترحيلات
        await runAllMigrations();

        console.log('\n🎉 Database setup completed successfully!');
        console.log('📋 Tables created: users, invalid_tokens, products, product_images, product_colors, product_sizes, settings, carts, cart_items, notifications, orders, order_items, invoices, reviews, favorites, coupons, customer_debts, cart_applied_coupons');

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        disconnect();
        console.log('\n🔌 Connection closed');
    }
}

module.exports = { setupDatabase };
