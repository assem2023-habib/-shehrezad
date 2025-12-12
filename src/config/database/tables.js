const { query } = require('./connection');

async function createUsersTables() {
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
}

async function createProductsTables() {
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
      token VARCHAR(100) UNIQUE,
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
}

async function createSettingsTables() {
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
}

async function createCartTables() {
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
}

async function createOrdersTables() {
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
}

async function createReviewsAndFavoriteTables() {
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
}

async function createCouponsTables() {
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

  // جدول الكوبونات المطبقة على السلة
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
}

async function createNotificationsTables() {

  // جدول الإشعارات الرئيسي
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      type VARCHAR(100) NOT NULL,
      data JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ Table 'notifications' created");

  // جدول ربط الإشعارات بالمستخدمين
  await query(`
    CREATE TABLE IF NOT EXISTS notification_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      notification_id INT NOT NULL,
      user_id INT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP NULL,
      FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      INDEX idx_user_read (user_id, is_read),
      INDEX idx_notification (notification_id)
    )
  `);
  console.log("✅ Table 'notification_users' created");
}

async function createDebtsTables() {
  // جدول ديون العملاء
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
}

module.exports = {
  createUsersTables,
  createProductsTables,
  createSettingsTables,
  createCartTables,
  createOrdersTables,
  createNotificationsTables,
  createReviewsAndFavoriteTables,
  createCouponsTables,
  createDebtsTables
};
