/**
 * Seed Coupons
 * بذر بيانات الكوبونات
 */

const seedCoupons = async (query) => {
    console.log('🎟️ Seeding coupons...');

    await query(`
    INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, start_date, end_date, usage_limit, status, target_audience, target_products_type) VALUES
    ('WELCOME10', 'percentage', 10, 0, 500, '2024-01-01', '2025-12-31', 1000, 'active', 'all', 'all'),
    ('SAVE20', 'percentage', 20, 100, 1000, '2024-01-01', '2025-12-31', 500, 'active', 'all', 'all'),
    ('FLAT50', 'fixed', 50, 200, NULL, '2024-01-01', '2025-12-31', 200, 'active', 'all', 'all'),
    ('VIP30', 'percentage', 30, 0, 2000, '2024-01-01', '2025-12-31', NULL, 'active', 'specific_users', 'all'),
    ('SUMMER25', 'percentage', 25, 150, 750, '2024-06-01', '2024-09-30', 100, 'inactive', 'all', 'all')
  `);

    console.log('✅ Coupons seeded');

    await query(`
    INSERT IGNORE INTO coupon_customers (coupon_id, user_id) VALUES
    (4, 2),
    (4, 3)
  `);

    console.log('✅ VIP coupon customers linked');
};

module.exports = { seedCoupons };
