/**
 * Profile Service - خدمة الملف الشخصي
 */

const pool = require('../../../../config/dbconnect');

/**
 * جلب الملف الشخصي للمستخدم
 */
const getProfile = async (userId) => {
  const users = await pool.query(`
    SELECT 
      user_id,
      full_name,
      email,
      phone,
      customer_code,
      role,
      invoice_image,
      created_at,
      updated_at
    FROM users
    WHERE user_id = ?
  `, [userId]);

  if (!users.length) {
    throw new Error('المستخدم غير موجود');
  }

  return users[0];
};

/**
 * تحديث الملف الشخصي للمستخدم
 */
const updateProfile = async (userId, data) => {
  const { full_name, email, phone } = data;
  
  // التحقق من تكرار الايميل أو الهاتف
  if (email) {
    const emailExists = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [email, userId]
    );
    if (emailExists.length > 0) {
      throw new Error('البريد الإلكتروني مستخدم من قبل');
    }
  }

  if (phone) {
    const phoneExists = await pool.query(
      'SELECT user_id FROM users WHERE phone = ? AND user_id != ?',
      [phone, userId]
    );
    if (phoneExists.length > 0) {
      throw new Error('رقم الهاتف مستخدم من قبل');
    }
  }

  // تحديث البيانات
  const updates = [];
  const params = [];

  if (full_name) {
    updates.push('full_name = ?');
    params.push(full_name);
  }
  if (email) {
    updates.push('email = ?');
    params.push(email);
  }
  if (phone) {
    updates.push('phone = ?');
    params.push(phone);
  }

  if (updates.length === 0) {
    throw new Error('لا توجد بيانات للتحديث');
  }

  params.push(userId);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
    params
  );

  return await getProfile(userId);
};

/**
 * تحديث صورة الفاتورة
 */
const updateInvoiceImage = async (userId, imageUrl) => {
  await pool.query(
    'UPDATE users SET invoice_image = ? WHERE user_id = ?',
    [imageUrl, userId]
  );
};

module.exports = {
  getProfile,
  updateProfile,
  updateInvoiceImage
};
