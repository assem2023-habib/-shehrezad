/**
 * Database Setup Script
 * سكريبت إنشاء قاعدة البيانات والجداول
 * 
 * تشغيل: node src/config/createdb.js
 */

require('dotenv').config();
const { createConnection } = require('mysql');

// إنشاء اتصال بدون تحديد قاعدة البيانات (لإنشائها أولاً)
const connection = createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
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

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to MySQL...');

    // الاتصال
    await new Promise((resolve, reject) => {
      connection.connect(err => {
        if (err) reject(err);
        else resolve();
      });
    });
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


    // جدول المستخدمين
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(50) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer','super_admin', 'employee') NOT NULL,
        phone VARCHAR(15) NOT NULL UNIQUE,
        customer_code VARCHAR(20) UNIQUE,
        invoice_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'users' created");


    // جدول التوكنات الملغية
    await query(`
      CREATE TABLE IF NOT EXISTS invalid_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token TEXT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'invalid_tokens' created");


    // جدول المنتجات
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        product_code VARCHAR(50) UNIQUE NOT NULL,
        product_name VARCHAR(150) NOT NULL,
        product_description TEXT,
        product_category ENUM('women','men','kids','accessories','offers','new') NOT NULL,
        price_usd DECIMAL(10,2) NOT NULL,
        price_try DECIMAL(10,2) NOT NULL,
        price_syp DECIMAL(15,2) NOT NULL,
        availability_status ENUM('visible','hidden') DEFAULT 'visible',
        is_show TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'products' created");


    // جدول صور المنتج
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        image_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        image_url VARCHAR(300) NOT NULL,
        public_id VARCHAR(255) NULL,
        is_main TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'product_images' created");


    // جدول ألوان المنتج
    await query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        color_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        color_name VARCHAR(50) NULL,
        color_value VARCHAR(50) NULL,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'product_colors' created");


    // جدول مقاسات المنتج
    await query(`
      CREATE TABLE IF NOT EXISTS product_sizes (
        size_id INT AUTO_INCREMENT PRIMARY KEY,
        color_id INT NOT NULL,
        size_value VARCHAR(20) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        FOREIGN KEY (color_id) REFERENCES product_colors(color_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'product_sizes' created");


    // جدول الإعدادات
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value VARCHAR(255) NOT NULL,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT NULL
      )
    `);
    console.log("✅ Table 'settings' created");

    // إدخال الإعدادات الافتراضية
    await query(`
      INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
      ('item_lock_minutes', '10', 'مدة السماح بحذف/تعديل العنصر بالدقائق'),
      ('cart_reminder_days', '15', 'عدد الأيام قبل إرسال تذكير الشحن'),
      ('max_cart_items', '50', 'الحد الأقصى لعناصر السلة'),
      ('max_images_per_product', '20', 'الحد الأقصى لصور المنتج')
    `);
    console.log("✅ Default settings inserted");


    // جدول السلة
    await query(`
      CREATE TABLE IF NOT EXISTS carts (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        cart_code VARCHAR(20) UNIQUE,
        status ENUM('active', 'pending_shipment', 'completed', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        reminder_sent TINYINT DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'carts' created");


    // جدول عناصر السلة
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        color_id INT NOT NULL,
        size_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        is_locked TINYINT DEFAULT 0,
        stock_deducted TINYINT DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (color_id) REFERENCES product_colors(color_id),
        FOREIGN KEY (size_id) REFERENCES product_sizes(size_id)
      )
    `);
    console.log("✅ Table 'cart_items' created");

    // جدول مستفيدي عناصر السلة
    await query(`
      CREATE TABLE IF NOT EXISTS cart_item_beneficiaries (
        beneficiary_id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        beneficiary_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES cart_items(item_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'cart_item_beneficiaries' created");


    // جدول الإشعارات
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        body TEXT,
        type ENUM('cart_reminder', 'order_update', 'general') DEFAULT 'general',
        is_read TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'notifications' created");


    // جدول الطلبات
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('unpaid', 'paid', 'pending', 'processing', 'shipped', 'completed', 'cancelled') DEFAULT 'unpaid',
        shipping_address TEXT,
        payment_method ENUM('cod', 'online') DEFAULT 'cod',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'orders' created");

    // جدول عناصر الطلب
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        color_id INT NOT NULL,
        size_id INT NOT NULL,
        quantity INT NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id),
        FOREIGN KEY (color_id) REFERENCES product_colors(color_id),
        FOREIGN KEY (size_id) REFERENCES product_sizes(size_id)
      )
    `);
    console.log("✅ Table 'order_items' created");

    // جدول الفواتير
    await query(`
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL UNIQUE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        issue_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        due_date TIMESTAMP NULL DEFAULT NULL,
        status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
        total_amount DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'invoices' created");


    // جدول التقييمات
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        review_id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        order_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_review (user_id, product_id, order_id)
      )
    `);
    console.log("✅ Table 'reviews' created");

    // جدول المفضلة
    await query(`
      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product_favorite (user_id, product_id)
      )
    `);
    console.log("✅ Table 'favorites' created");


    // ==========================================
    // جداول الكوبونات (Coupons)
    // ==========================================

    // جدول الكوبونات
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        coupon_id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type ENUM('percentage', 'fixed') NOT NULL,
        discount_value DECIMAL(10, 2) NOT NULL,
        min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
        max_discount_amount DECIMAL(10, 2) NULL,
        start_date DATETIME NULL,
        end_date DATETIME NULL,
        usage_limit INT NULL,
        used_count INT DEFAULT 0,
        status ENUM('active', 'inactive') DEFAULT 'active',
        target_audience ENUM('all', 'specific_users') DEFAULT 'all',
        target_products_type ENUM('all', 'specific_products') DEFAULT 'all',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table 'coupons' created");

    // جدول العملاء المخصصين للكوبون
    await query(`
      CREATE TABLE IF NOT EXISTS coupon_customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'coupon_customers' created");

    // جدول المنتجات المخصصة للكوبون
    await query(`
      CREATE TABLE IF NOT EXISTS coupon_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        coupon_id INT NOT NULL,
        product_id INT NOT NULL,
        FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'coupon_products' created");

    // تحديث جدول الطلبات لإضافة الكوبون والخصم
    // نستخدم try-catch لتجنب الخطأ إذا كانت الأعمدة موجودة مسبقاً
    try {
      await query("ALTER TABLE orders ADD COLUMN coupon_id INT NULL");
      await query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0");
      await query("ALTER TABLE orders ADD CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)");
      console.log("✅ Table 'orders' updated with coupon fields");
    } catch (e) {
      // تجاهل الخطأ إذا كانت الأعمدة موجودة (Duplicate column name)
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on orders update: " + e.message);
      }
    }

    // ==========================================
    // إصلاحات (Migrations)
    // ==========================================

    // إصلاح: إزالة القيد الفريد على user_id في جدول carts للسماح بتعدد السلات
    try {
      // 1. إضافة فهرس عادي (للحفاظ على أداء الـ Foreign Key)
      // نستخدم IGNORE لتجنب الخطأ إذا كان الفهرس موجوداً
      // ملاحظة: MySQL لا تدعم ALTER IGNORE بشكل مباشر للفهارس في كل الإصدارات، لذا نستخدم try-catch منفصل
      try {
        await query("CREATE INDEX idx_user_id_regular ON carts(user_id)");
      } catch (idxErr) {
        // نتجاهل الخطأ إذا كان الفهرس موجوداً
      }

      // 2. حذف الفهرس الفريد القديم (الذي يمنع تكرار user_id)
      await query("ALTER TABLE carts DROP INDEX user_id");
      console.log("✅ Fixed carts table: Removed UNIQUE constraint from user_id");
    } catch (e) {
      // نتجاهل الخطأ إذا كان الفهرس غير موجود (تم حذفه مسبقاً)
      if (!e.message.includes("check that column/key exists")) {
        console.log("ℹ️ Note on carts fix: " + e.message);
      }
    }

    // إضافة حقل is_show للمنتجات (للتحكم بالظهور في الواجهة الرئيسية)
    try {
      await query("ALTER TABLE products ADD COLUMN is_show TINYINT DEFAULT 1");
      console.log("✅ Added is_show column to products table");
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on products is_show: " + e.message);
      }
    }

    // ==========================================
    // جدول ديون العملاء (Customer Debts)
    // ==========================================
    await query(`
      CREATE TABLE IF NOT EXISTS customer_debts (
        debt_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        order_id INT,
        description VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        paid_amount DECIMAL(10, 2) DEFAULT 0,
        remaining DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Table 'customer_debts' created");

    // إضافة حقل confirmed_by لجدول الطلبات
    try {
      await query("ALTER TABLE orders ADD COLUMN confirmed_by INT NULL");
      await query("ALTER TABLE orders ADD CONSTRAINT fk_order_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(user_id)");
      console.log("✅ Added confirmed_by column to orders table");
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on orders confirmed_by: " + e.message);
      }
    }

    // إضافة حقل invoice_image لجدول المستخدمين
    try {
      await query("ALTER TABLE users ADD COLUMN invoice_image VARCHAR(255)");
      console.log("✅ Added invoice_image column to users table");
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on users invoice_image: " + e.message);
      }
    }


    // إضافة حقول الملاحظات والعملة لجدول الطلبات
    try {
      await query("ALTER TABLE orders ADD COLUMN customer_note TEXT NULL");
      await query("ALTER TABLE orders ADD COLUMN cart_note TEXT NULL");
      await query("ALTER TABLE orders ADD COLUMN currency ENUM('USD','TRY','SYP') DEFAULT 'TRY'");
      console.log("✅ Added notes and currency columns to orders table");
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on orders notes/currency: " + e.message);
      }
    }

    // تحديث حالة الطلب لإضافة UNPAID كقيمة افتراضية وموجودة ضمن ENUM
    try {
      await query("ALTER TABLE orders MODIFY COLUMN status ENUM('unpaid','paid','pending','processing','shipped','completed','cancelled') DEFAULT 'unpaid'");
      console.log("✅ Updated orders.status ENUM to include 'unpaid' with default");
    } catch (e) {
      if (!e.message.includes("Duplicate column name") && !e.message.includes("DATA TYPE")) {
        console.log("ℹ️ Note on orders status enum: " + e.message);
      }
    }

    await query(`
      CREATE TABLE IF NOT EXISTS cart_applied_coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        item_id INT NULL,
        coupon_id INT NOT NULL,
        user_id INT NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES cart_items(item_id) ON DELETE CASCADE,
        FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'cart_applied_coupons' created");

    // إضافة حقل العملة لجدول ديون العملاء
    try {
      await query("ALTER TABLE customer_debts ADD COLUMN currency ENUM('USD','TRY','SYP') DEFAULT 'TRY'");
      console.log("✅ Added currency column to customer_debts table");
    } catch (e) {
      if (!e.message.includes("Duplicate column name")) {
        console.log("ℹ️ Note on debts currency: " + e.message);
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📋 Tables created: users, invalid_tokens, products, product_images, product_colors, product_sizes, settings, carts, cart_items, notifications, orders, order_items, invoices, reviews, coupons, customer_debts');

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    connection.end();
    console.log('\n🔌 Connection closed');
  }
}

setupDatabase();
