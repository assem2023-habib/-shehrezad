/**
 * Customer Debts Service
 * خدمة ديون العملاء
 */

const pool = require('../../../../config/dbconnect');

/**
 * جلب ملخص ديون العميل بحسب العملة
 */
const getMyDebtsSummary = async (userId) => {
    const rows = await pool.query(`
    SELECT currency, COALESCE(SUM(remaining), 0) as amount
    FROM customer_debts
    WHERE user_id = ? AND status != 'paid'
    GROUP BY currency
  `, [userId]);

    const total = rows.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
        total_debt: total,
        by_currency: rows.map(r => ({
            currency: r.currency || 'TRY',
            amount: parseFloat(r.amount)
        }))
    };
};

/**
 * جلب سجل ديون العميل مع التفاصيل
 */
const getMyDebtsHistory = async (userId, filters = {}) => {
    const { status, currency, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = `
    SELECT 
      d.*,
      o.order_id,
      o.total_amount as order_total,
      o.created_at as order_date,
      (SELECT invoice_number FROM invoices WHERE order_id = d.order_id LIMIT 1) as invoice_number
    FROM customer_debts d
    LEFT JOIN orders o ON d.order_id = o.order_id
    WHERE d.user_id = ?
  `;

    const params = [userId];

    // تصفية حسب الحالة
    if (status) {
        query += ' AND d.status = ?';
        params.push(status);
    }

    // تصفية حسب العملة
    if (currency) {
        query += ' AND d.currency = ?';
        params.push(currency);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const debts = await pool.query(query, params);

    // حساب العدد الكلي
    let countQuery = 'SELECT COUNT(*) as total FROM customer_debts WHERE user_id = ?';
    const countParams = [userId];

    if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
    }

    if (currency) {
        countQuery += ' AND currency = ?';
        countParams.push(currency);
    }

    const totalResult = await pool.query(countQuery, countParams);
    const total = totalResult[0].total;

    // جلب ملخص الديون
    const summary = await getMyDebtsSummary(userId);

    return {
        summary,
        debts,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * جلب تفاصيل دين محدد
 */
const getMyDebtById = async (userId, debtId) => {
    const debts = await pool.query(`
    SELECT 
      d.*,
      o.order_id,
      o.total_amount as order_total,
      o.status as order_status,
      o.created_at as order_date,
      (SELECT invoice_number FROM invoices WHERE order_id = d.order_id LIMIT 1) as invoice_number
    FROM customer_debts d
    LEFT JOIN orders o ON d.order_id = o.order_id
    WHERE d.user_id = ? AND d.debt_id = ?
  `, [userId, debtId]);

    if (!debts.length) return null;

    return debts[0];
};

module.exports = {
    getMyDebtsSummary,
    getMyDebtsHistory,
    getMyDebtById
};
