/**
 * Seed Orders
 * بذر بيانات الطلبات
 */

const seedOrders = async (query, userIds) => {
    console.log('📋 Seeding orders...');

    const customerId = userIds['ahmad@example.com'];

    if (customerId) {
        const orderResult = await query(`
      INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
      VALUES (?, 4500.00, 'completed', 'شارع الملك فهد، الرياض، السعودية', 'cod')
    `, [customerId]);

        const orderId = orderResult.insertId;

        await query(`
      INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase)
      VALUES (?, 1, 1, 1, 1, 4500.00)
    `, [orderId]);

        await query(`
      INSERT INTO invoices (order_id, invoice_number, status, total_amount)
      VALUES (?, 'INV-20241205-00001', 'paid', 4500.00)
    `, [orderId]);

        console.log('✅ Orders seeded');
        return orderId;
    } else {
        console.log('⚠️ No customer found, skipping orders');
        return null;
    }
};

module.exports = { seedOrders };
