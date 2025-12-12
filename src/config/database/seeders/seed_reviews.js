/**
 * Seed Reviews
 * بذر بيانات التقييمات
 */

const seedReviews = async (query, userIds, orderId) => {
    console.log('⭐ Seeding reviews...');

    if (!orderId) {
        console.log('⚠️ No order found, skipping reviews');
        return;
    }

    const customerId = userIds['ahmad@example.com'];
    const customer2Id = userIds['fatima@example.com'];

    await query(`
    INSERT IGNORE INTO reviews (product_id, user_id, order_id, rating, comment, status) VALUES
    (1, ?, ?, 5, 'منتج رائع! الجودة ممتازة والتوصيل سريع', 'approved')
  `, [customerId, orderId]);

    if (customer2Id) {
        await query(`
      INSERT IGNORE INTO reviews (product_id, user_id, order_id, rating, comment, status) VALUES
      (1, ?, ?, 4, 'جيد جداً، أنصح به', 'approved')
    `, [customer2Id, orderId]);
    }

    console.log('✅ Reviews seeded');
};

module.exports = { seedReviews };
