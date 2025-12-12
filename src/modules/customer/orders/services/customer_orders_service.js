/**
 * Customer Orders Service
 * خدمة الطلبات للعملاء
 */

const pool = require('../../../../config/dbconnect');

/**
 * جلب جميع طلبات العميل مع pagination وfilters
 */
const getMyOrders = async (userId, filters = {}) => {
    const { status, search, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = `
    SELECT 
      o.order_id,
      o.total_amount,
      o.status,
      o.currency,
      o.created_at,
      i.invoice_number,
      i.status as invoice_status,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.order_id) as items_count
    FROM orders o
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.user_id = ?
  `;

    const params = [userId];

    // تصفية حسب الحالة
    if (status) {
        query += ' AND o.status = ?';
        params.push(status);
    }

    // بحث برقم الفاتورة
    if (search) {
        query += ' AND i.invoice_number LIKE ?';
        params.push(`%${search}%`);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const orders = await pool.query(query, params);

    // حساب العدد الكلي للطلبات
    let countQuery = `
    SELECT COUNT(*) as total 
    FROM orders o 
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.user_id = ?
  `;
    const countParams = [userId];

    if (status) {
        countQuery += ' AND o.status = ?';
        countParams.push(status);
    }

    if (search) {
        countQuery += ' AND i.invoice_number LIKE ?';
        countParams.push(`%${search}%`);
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
 * جلب تفاصيل طلب محدد للعميل
 */
const getMyOrderById = async (userId, orderId) => {
    const orders = await pool.query(`
    SELECT 
      o.*,
      confirmer.full_name as confirmed_by_name,
      i.invoice_number,
      i.issue_date,
      i.status as invoice_status
    FROM orders o
    LEFT JOIN users confirmer ON o.confirmed_by = confirmer.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.user_id = ? AND o.order_id = ?
  `, [userId, orderId]);

    if (!orders.length) return null;
    const order = orders[0];

    // جلب عناصر الطلب
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

    // إزالة الحقول غير المطلوبة
    const { coupon_id, discount_amount, payment_method, ...orderData } = order;

    return {
        ...orderData,
        items
    };
};

module.exports = {
    getMyOrders,
    getMyOrderById
};
