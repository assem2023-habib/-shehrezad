/**
 * Seed Users
 * بذر بيانات المستخدمين
 */

const bcrypt = require('bcrypt');

const seedUsers = async (query) => {
    console.log('👥 Seeding users...');

    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    const users = [
        { name: 'مدير النظام', email: 'admin@shehrezad.com', role: 'super_admin', phone: '0500000001', code: null },
        { name: 'أحمد محمد', email: 'ahmad@example.com', role: 'customer', phone: '0500000002', code: 'CUST001' },
        { name: 'فاطمة علي', email: 'fatima@example.com', role: 'customer', phone: '0500000003', code: 'CUST002' },
        { name: 'محمد سعيد', email: 'mohammad@example.com', role: 'customer', phone: '0500000004', code: 'CUST003' },
        { name: 'سارة أحمد', email: 'sara@example.com', role: 'customer', phone: '0500000005', code: 'CUST004' }
    ];

    const userIds = {};
    for (const user of users) {
        const password = user.role === 'super_admin' ? adminPassword : customerPassword;
        try {
            await query(
                `INSERT INTO users (full_name, email, password, role, phone, customer_code) 
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
                [user.name, user.email, password, user.role, user.phone, user.code]
            );

            const userRow = await query('SELECT user_id FROM users WHERE email = ?', [user.email]);
            userIds[user.email] = userRow[0].user_id;
        } catch (e) {
            const userRow = await query('SELECT user_id FROM users WHERE email = ?', [user.email]);
            if (userRow.length > 0) {
                userIds[user.email] = userRow[0].user_id;
            }
        }
    }

    console.log('✅ Users seeded');
    return userIds;
};

module.exports = { seedUsers };
