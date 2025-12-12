/**
 * Orders Retrieval Service
 * خدمة استرجاع بيانات الطلبات
 */

const pool = require('../../../../config/dbconnect');

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

const getOrderById = async (orderId) => {
    const orders = await pool.query(`
    SELECT 
      o.*,
      u.full_name,
      u.phone,
      u.email,
      u.customer_code,
      u.invoice_image,
      confirmer.full_name as confirmed_by_name,
      i.invoice_number,
      i.issue_date,
      i.status as invoice_status
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN users confirmer ON o.confirmed_by = confirmer.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.order_id = ?
  `, [orderId]);

    if (!orders.length) return null;
    const order = orders[0];

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

    // إزالة الحقول غير المطلوبة وحقول المستخدم
    const { 
        full_name, 
        phone, 
        email, 
        customer_code, 
        invoice_image,
        coupon_id,
        discount_amount,
        payment_method,
        ...orderWithoutUserFields 
    } = order;

    return {
        ...orderWithoutUserFields,
        customer,
        items
    };
};

const searchOrders = async ({ order_id, invoice_number, customer_code }) => {
    let q = `SELECT o.order_id, o.total_amount, o.status, o.created_at, u.full_name, u.customer_code, i.invoice_number FROM orders o JOIN users u ON o.user_id = u.user_id LEFT JOIN invoices i ON o.order_id = i.order_id WHERE 1=1`;
    const params = [];
    if (order_id) { q += ' AND o.order_id = ?'; params.push(parseInt(order_id)); }
    if (invoice_number) { q += ' AND i.invoice_number = ?'; params.push(invoice_number); }
    if (customer_code) { q += ' AND u.customer_code = ?'; params.push(customer_code); }
    q += ' ORDER BY o.created_at DESC LIMIT 50';
    return await pool.query(q, params);
};

const getOrderItemDetails = async (orderId, itemId) => {
    const rows = await pool.query(`
    SELECT oi.*, p.product_name, p.product_code, pc.color_name, pc.color_value, ps.size_value
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    JOIN product_colors pc ON oi.color_id = pc.color_id
    JOIN product_sizes ps ON oi.size_id = ps.size_id
    WHERE oi.order_id = ? AND oi.item_id = ?
  `, [orderId, itemId]);
    return rows.length ? rows[0] : null;
};

module.exports = {
    getAllOrders,
    getOrderById,
    searchOrders,
    getOrderItemDetails
};
