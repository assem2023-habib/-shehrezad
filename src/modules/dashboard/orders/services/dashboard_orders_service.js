/**
 * Dashboard Orders Service - خدمة الطلبات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');
const { ORDER_STATUS } = require('../../../../config/constants');

/**
 * جلب جميع الطلبات مع الفلترة
 */
const getAllOrders = async (filters = {}) => {
  const { status, search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      o.order_id,
      o.total_amount,
      o.status,
      o.created_at,
      u.full_name as customer_name,
      u.phone as customer_phone,
      u.customer_code,
      i.invoice_number,
      i.status as invoice_status
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (u.full_name LIKE ? OR u.customer_code LIKE ? OR i.invoice_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const orders = await pool.query(query, params);

  // حساب العدد الكلي للصفحات
  let countQuery = `
    SELECT COUNT(*) as total 
    FROM orders o 
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE 1=1
  `;
  const countParams = [];

  if (status) {
    countQuery += ' AND o.status = ?';
    countParams.push(status);
  }

  if (search) {
    countQuery += ' AND (u.full_name LIKE ? OR u.customer_code LIKE ? OR i.invoice_number LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = totalResult[0].total;

  return {
    orders,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * جلب تفاصيل طلب محدد
 */
const getOrderById = async (orderId) => {
  // 1. تفاصيل الطلب الأساسية
  const orders = await pool.query(`
    SELECT 
      o.*,
      u.full_name,
      u.phone,
      u.email,
      u.customer_code,
      u.invoice_image,
      i.invoice_number,
      i.issue_date,
      i.status as invoice_status
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (!orders.length) return null;
  const order = orders[0];

  // 2. عناصر الطلب
  const items = await pool.query(`
    SELECT 
      oi.*,
      p.product_name,
      p.product_code,
      pc.color_name,
      pc.color_value,
      ps.size_value,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    JOIN product_colors pc ON oi.color_id = pc.color_id
    JOIN product_sizes ps ON oi.size_id = ps.size_id
    WHERE oi.order_id = ?
  `, [orderId]);

  const customer = {
    user_id: order.user_id,
    full_name: order.full_name,
    phone: order.phone,
    email: order.email,
    customer_code: order.customer_code,
    invoice_image: order.invoice_image || null
  };

  const { full_name, phone, email, customer_code, invoice_image, ...orderWithoutUserFields } = order;

  return {
    ...orderWithoutUserFields,
    customer,
    items
  };
};

/**
 * تحديث حالة الطلب
 */
const updateOrderStatus = async (orderId, status) => {
  const allowedStatus = Object.values(ORDER_STATUS);
  if (!allowedStatus.includes(status)) {
    throw new Error('حالة الطلب غير صالحة');
  }

  // جلب الحالة الحالية للطلب
  const currentOrder = await pool.query(
    'SELECT status FROM orders WHERE order_id = ?',
    [orderId]
  );

  if (!currentOrder.length) {
    throw new Error('الطلب غير موجود');
  }

  const currentStatus = currentOrder[0].status;

  // إذا كان الطلب ملغياً بالفعل، لا يمكن تغيير حالته
  if (currentStatus === ORDER_STATUS.CANCELLED) {
    throw new Error('لا يمكن تغيير حالة طلب ملغي');
  }

  // إذا تم إلغاء الطلب، أعد المخزون
  if (status === ORDER_STATUS.CANCELLED && currentStatus !== ORDER_STATUS.CANCELLED) {
    await restoreStock(orderId);
  }

  await pool.query(
    'UPDATE orders SET status = ? WHERE order_id = ?',
    [status, orderId]
  );

  return { order_id: orderId, status };
};

/**
 * إعادة المخزون عند إلغاء الطلب
 * @param {number} orderId - معرف الطلب
 */
const restoreStock = async (orderId) => {
  // 1. جلب عناصر الطلب
  const orderItems = await pool.query(
    'SELECT size_id, quantity FROM order_items WHERE order_id = ?',
    [orderId]
  );

  if (!orderItems.length) {
    return; // لا توجد عناصر للإعادة
  }

  // 2. بدء Transaction لضمان سلامة البيانات
  const connection = await new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) reject(err);
      else resolve(conn);
    });
  });

  const query = (sql, params) => {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  };

  try {
    await query('START TRANSACTION');

    // 3. إعادة الكمية لكل عنصر
    for (const item of orderItems) {
      await query(
        'UPDATE product_sizes SET quantity = quantity + ? WHERE size_id = ?',
        [item.quantity, item.size_id]
      );
    }

    await query('COMMIT');
    console.log(`✅ تم إعادة المخزون للطلب رقم ${orderId}`);

  } catch (error) {
    await query('ROLLBACK');
    console.error(`❌ خطأ في إعادة المخزون للطلب ${orderId}:`, error);
    throw new Error('فشل في إعادة المخزون');
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  restoreStock,
  searchOrders: async ({ order_id, invoice_number, customer_code }) => {
    let q = `SELECT o.order_id, o.total_amount, o.status, o.created_at, u.full_name, u.customer_code, i.invoice_number FROM orders o JOIN users u ON o.user_id = u.user_id LEFT JOIN invoices i ON o.order_id = i.order_id WHERE 1=1`;
    const params = [];
    if (order_id) { q += ' AND o.order_id = ?'; params.push(parseInt(order_id)); }
    if (invoice_number) { q += ' AND i.invoice_number = ?'; params.push(invoice_number); }
    if (customer_code) { q += ' AND u.customer_code = ?'; params.push(customer_code); }
    q += ' ORDER BY o.created_at DESC LIMIT 50';
    return await pool.query(q, params);
  },
  getOrderItemDetails: async (orderId, itemId) => {
    const rows = await pool.query(`
      SELECT oi.*, p.product_name, p.product_code, pc.color_name, pc.color_value, ps.size_value
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      JOIN product_colors pc ON oi.color_id = pc.color_id
      JOIN product_sizes ps ON oi.size_id = ps.size_id
      WHERE oi.order_id = ? AND oi.item_id = ?
    `, [orderId, itemId]);
    return rows.length ? rows[0] : null;
  }
};
