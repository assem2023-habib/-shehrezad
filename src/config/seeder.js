/**
 * Database Seeder - بذر البيانات التجريبية
 * 
 * تشغيل: node src/config/seeder.js
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

    // ==========================================
    // 1. المستخدمين
    // ==========================================
    console.log('👥 Seeding users...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // إدخال المستخدمين واحداً تلو الآخر
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
        const result = await query(
          `INSERT INTO users (full_name, email, password, role, phone, customer_code) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)`,
          [user.name, user.email, password, user.role, user.phone, user.code]
        );
        
        // جلب الـ ID
        const userRow = await query('SELECT user_id FROM users WHERE email = ?', [user.email]);
        userIds[user.email] = userRow[0].user_id;
      } catch (e) {
        // في حالة تكرار الهاتف، نجلب الـ ID الموجود
        const userRow = await query('SELECT user_id FROM users WHERE email = ?', [user.email]);
        if (userRow.length > 0) {
          userIds[user.email] = userRow[0].user_id;
        }
      }
    }
    
    console.log('✅ Users seeded');

    // ==========================================
    // 2. المنتجات
    // ==========================================
    console.log('📦 Seeding products...');

    await query(`
      INSERT IGNORE INTO products (product_code, product_name, product_description, product_category, price_usd, price_try, price_syp, availability_status, is_show) VALUES
      ('PROD001', 'فستان سهرة أنيق', 'فستان سهرة طويل مع تطريز يدوي', 'women', 150.00, 4500.00, 2000000.00, 'visible', 1),
      ('PROD002', 'بلوزة قطنية', 'بلوزة قطنية مريحة بألوان متعددة', 'women', 35.00, 1050.00, 450000.00, 'visible', 1),
      ('PROD003', 'تنورة كلاسيكية', 'تنورة كلاسيكية للعمل', 'women', 45.00, 1350.00, 600000.00, 'visible', 1),
      ('PROD004', 'قميص رجالي رسمي', 'قميص رسمي من القطن الفاخر', 'men', 55.00, 1650.00, 730000.00, 'visible', 1),
      ('PROD005', 'بنطال جينز', 'بنطال جينز عصري مريح', 'men', 65.00, 1950.00, 860000.00, 'visible', 1),
      ('PROD006', 'جاكيت شتوي', 'جاكيت شتوي دافئ', 'men', 120.00, 3600.00, 1600000.00, 'visible', 1),
      ('PROD007', 'فستان أطفال', 'فستان أطفال قطني ملون', 'kids', 25.00, 750.00, 330000.00, 'visible', 1),
      ('PROD008', 'بدلة أطفال', 'بدلة أطفال للمناسبات', 'kids', 75.00, 2250.00, 1000000.00, 'visible', 1),
      ('PROD009', 'حقيبة يد جلدية', 'حقيبة يد جلدية أنيقة', 'accessories', 85.00, 2550.00, 1130000.00, 'visible', 1),
      ('PROD010', 'وشاح حريري', 'وشاح حريري فاخر بنقشات', 'accessories', 40.00, 1200.00, 530000.00, 'visible', 1)
    `);
    
    console.log('✅ Products seeded');

    // ==========================================
    // 3. صور المنتجات
    // ==========================================
    console.log('🖼️ Seeding product images...');

    await query(`
      INSERT IGNORE INTO product_images (product_id, image_url, is_main) VALUES
      (1, 'https://via.placeholder.com/400x600?text=Dress1', 1),
      (1, 'https://via.placeholder.com/400x600?text=Dress2', 0),
      (2, 'https://via.placeholder.com/400x600?text=Blouse', 1),
      (3, 'https://via.placeholder.com/400x600?text=Skirt', 1),
      (4, 'https://via.placeholder.com/400x600?text=Shirt', 1),
      (5, 'https://via.placeholder.com/400x600?text=Jeans', 1),
      (6, 'https://via.placeholder.com/400x600?text=Jacket', 1),
      (7, 'https://via.placeholder.com/400x600?text=KidsDress', 1),
      (8, 'https://via.placeholder.com/400x600?text=KidsSuit', 1),
      (9, 'https://via.placeholder.com/400x600?text=Bag', 1),
      (10, 'https://via.placeholder.com/400x600?text=Scarf', 1)
    `);
    
    console.log('✅ Product images seeded');

    // ==========================================
    // 4. ألوان المنتجات
    // ==========================================
    console.log('🎨 Seeding product colors...');

    await query(`
      INSERT IGNORE INTO product_colors (product_id, color_name, color_value) VALUES
      (1, 'أسود', '#000000'),
      (1, 'أحمر', '#FF0000'),
      (2, 'أبيض', '#FFFFFF'),
      (2, 'أزرق فاتح', '#87CEEB'),
      (3, 'كحلي', '#000080'),
      (4, 'أبيض', '#FFFFFF'),
      (4, 'أزرق', '#0000FF'),
      (5, 'أزرق داكن', '#00008B'),
      (5, 'أسود', '#000000'),
      (6, 'بني', '#8B4513'),
      (7, 'وردي', '#FFC0CB'),
      (8, 'كحلي', '#000080'),
      (9, 'أسود', '#000000'),
      (9, 'بيج', '#F5F5DC'),
      (10, 'أحمر', '#FF0000'),
      (10, 'أخضر', '#008000')
    `);
    
    console.log('✅ Product colors seeded');

    // ==========================================
    // 5. مقاسات المنتجات
    // ==========================================
    console.log('📏 Seeding product sizes...');

    // جلب الألوان
    const colors = await query('SELECT color_id, product_id FROM product_colors');
    
    for (const color of colors) {
      const sizes = ['S', 'M', 'L', 'XL'];
      for (const size of sizes) {
        const quantity = Math.floor(Math.random() * 20) + 5; // 5-24
        await query(
          'INSERT IGNORE INTO product_sizes (color_id, size_value, quantity) VALUES (?, ?, ?)',
          [color.color_id, size, quantity]
        );
      }
    }
    
    console.log('✅ Product sizes seeded');

    // ==========================================
    // 6. الكوبونات
    // ==========================================
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

    // ربط كوبون VIP30 بالعملاء المميزين
    await query(`
      INSERT IGNORE INTO coupon_customers (coupon_id, user_id) VALUES
      (4, 2),
      (4, 3)
    `);

    console.log('✅ VIP coupon customers linked');

    // ==========================================
    // 7. الطلبات التجريبية
    // ==========================================
    console.log('📋 Seeding orders...');

    // جلب الـ user_id للعميل الأول
    const customerId = userIds['ahmad@example.com'];
    
    if (customerId) {
      const orderResult = await query(`
        INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_method)
        VALUES (?, 4500.00, 'completed', 'شارع الملك فهد، الرياض، السعودية', 'cod')
      `, [customerId]);

      const orderId = orderResult.insertId;

      // عناصر الطلب
      await query(`
        INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase)
        VALUES (?, 1, 1, 1, 1, 4500.00)
      `, [orderId]);

      // فاتورة الطلب
      await query(`
        INSERT INTO invoices (order_id, invoice_number, status, total_amount)
        VALUES (?, 'INV-20241205-00001', 'paid', 4500.00)
      `, [orderId]);

      console.log('✅ Orders seeded');

      // ==========================================
      // 8. التقييمات
      // ==========================================
      console.log('⭐ Seeding reviews...');

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
    } else {
      console.log('⚠️ No customer found, skipping orders and reviews');
    }

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

seedDatabase();
