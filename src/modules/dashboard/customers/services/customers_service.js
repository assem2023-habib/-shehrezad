/**
 * Customers Service - خدمة إدارة العملاء
 */

const pool = require('../../../../config/dbconnect');
const bcrypt = require('bcrypt');
const { USER_ROLES } = require('../../../../config/constants');

/**
 * جلب آخر 4 عملاء مضافين
 */
const getLastAddedCustomers = async () => {
  const query = `
    SELECT full_name, customer_code, created_at, invoice_image
    FROM users
    WHERE role = ?
    ORDER BY created_at DESC
    LIMIT 4
  `;
  const customers = await pool.query(query, [USER_ROLES.CUSTOMER]);
  
  // حساب الوقت منذ الإضافة (مثال: "قبل 2 ساعة")
  const now = new Date();
  const formatted = customers.map(c => {
    const diffMs = now - new Date(c.created_at);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    let timeAgo = '';
    if (diffMinutes < 60) {
      timeAgo = `منذ ${diffMinutes} دقيقة`;
    } else if (diffMinutes < 1440) {
      timeAgo =` منذ ${Math.floor(diffMinutes / 60)} ساعة`;
    } else {
      timeAgo = `منذ ${Math.floor(diffMinutes / 1440)} يوم`;
    }

    return {
      full_name: c.full_name,
      customer_code: c.customer_code,
      invoice_image: c.invoice_image,
      created_at: c.created_at,
      time_ago: timeAgo
    };
  });

  return formatted;
};

/**
 * توليد كود عميل فريد
 * الصيغة: SHZ-YYYYMMDD-XXXXX (مثال: SHZ-20241205-00001)
 */
const generateCustomerCode = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // الحصول على آخر كود لهذا اليوم
  const lastCustomer = await pool.query(
    'SELECT customer_code FROM users WHERE customer_code LIKE ? ORDER BY user_id DESC LIMIT 1',
    [`SHZ-${dateStr}-%`]
  );

  let sequence = 1;
  if (lastCustomer.length > 0 && lastCustomer[0].customer_code) {
    const lastNum = lastCustomer[0].customer_code.split('-')[2];
    sequence = parseInt(lastNum) + 1;
  }

  return `SHZ-${dateStr}-${String(sequence).padStart(5, '0')}`;
};

/**
 * إضافة عميل جديد
 */
const createCustomer = async (customerData) => {
  const { full_name, phone, email, password, invoice_image } = customerData;

  // التحقق من عدم تكرار الهاتف
  const phoneCheck = await pool.query(
    'SELECT user_id FROM users WHERE phone = ?',
    [phone]
  );
  
  if (phoneCheck.length) {
    const error = new Error('رقم الهاتف مستخدم مسبقاً');
    error.status = 400;
    throw error;
  }

  // توليد كود فريد
  const customer_code = await generateCustomerCode();

  // تشفير كلمة المرور
  const hashedPassword = await bcrypt.hash(password, 10);

  // إضافة العميل
  const result = await pool.query(`
    INSERT INTO users (full_name, phone, email, password, role, customer_code, invoice_image)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    full_name,
    phone,
    email || null,
    hashedPassword,
    USER_ROLES.CUSTOMER,
    customer_code,
    invoice_image || null
  ]);

  return {
    user_id: result.insertId,
    full_name,
    phone,
    email,
    customer_code,
    role: USER_ROLES.CUSTOMER,
    invoice_image
  };
};

/**
 * تحديث بيانات العميل
 */
const updateCustomer = async (userId, customerData) => {
  const { full_name, phone, email } = customerData;

  // التحقق من وجود العميل
  const existingCustomer = await pool.query(
    'SELECT user_id, invoice_image FROM users WHERE user_id = ? AND role = ?',
    [userId, USER_ROLES.CUSTOMER]
  );

  if (!existingCustomer.length) {
    const error = new Error('العميل غير موجود');
    error.status = 404;
    throw error;
  }

  // التحقق من عدم تكرار الهاتف (إذا تغير)
  if (phone) {
    const phoneCheck = await pool.query(
      'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
      [phone, userId]
    );
    
    if (phoneCheck.length) {
      const error = new Error('رقم الهاتف مستخدم مسبقاً');
      error.status = 400;
      throw error;
    }
  }

  // تحديث البيانات
  await pool.query(`
    UPDATE users 
    SET full_name = COALESCE(?, full_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        updated_at = NOW()
    WHERE user_id = ?
  `, [full_name, phone, email, userId]);

  return {
    user_id: userId,
    invoice_image: existingCustomer[0].invoice_image,
    full_name,
    phone,
    email
  };
};

/**
 * حذف عميل
 */
const deleteCustomer = async (userId) => {
  // التحقق من وجود العميل
  const existingCustomer = await pool.query(
    'SELECT user_id FROM users WHERE user_id = ? AND role = ?',
    [userId, USER_ROLES.CUSTOMER]
  );

  if (!existingCustomer.length) {
    const error = new Error('العميل غير موجود');
    error.status = 404;
    throw error;
  }

  // يمكن إضافة تحقق إضافي هنا، مثلاً منع الحذف إذا كان لديه طلبات نشطة
  // حالياً سنقوم بالحذف المباشر (أو يمكن استخدام soft delete)
  
  await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);

  return { message: 'تم حذف العميل بنجاح' };
};

/**
 * جلب جميع العملاء مع إمكانية البحث
 */
const getAllCustomers = async (search = null) => {
  let query = `
    SELECT 
      u.user_id,
      u.full_name,
      u.phone,
      u.email,
      u.invoice_image,
      u.customer_code,
      u.created_at,
      (SELECT COUNT(*) FROM carts WHERE user_id = u.user_id) as carts_count
    FROM users u
    WHERE u.role = ?
  `;

  const params = [USER_ROLES.CUSTOMER];

  if (search) {
    query += ' AND (u.full_name LIKE ? OR u.customer_code LIKE ? OR u.phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY u.created_at DESC';

  const customers = await pool.query(query, params);

  return customers;
};

/**
 * جلب تفاصيل عميل
 */
const getCustomerById = async (userId) => {
  const customers = await pool.query(`
    SELECT 
      u.*,
      (SELECT COUNT(*) FROM carts WHERE user_id = u.user_id) as carts_count,
      (SELECT COUNT(*) FROM cart_items ci 
        JOIN carts c ON ci.cart_id = c.cart_id 
        WHERE c.user_id = u.user_id) as total_items
    FROM users u
    WHERE u.user_id = ? AND u.role = ?
  `, [userId, USER_ROLES.CUSTOMER]);

  return customers.length ? customers[0] : null;
};

module.exports = {
  generateCustomerCode,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  getLastAddedCustomers
};
