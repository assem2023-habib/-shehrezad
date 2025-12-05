/**
 * Debts Service - خدمة ديون العملاء
 */

const pool = require('../../../../config/dbconnect');

/**
 * جلب رصيد الديون للعميل
 */
const getCustomerDebtBalance = async (userId) => {
  const result = await pool.query(`
    SELECT 
      COALESCE(SUM(remaining), 0) as total_debt
    FROM customer_debts
    WHERE user_id = ? AND status != 'paid'
  `, [userId]);

  return parseFloat(result[0].total_debt) || 0;
};

/**
 * جلب سجل ديون العميل
 */
const getDebtHistory = async (userId) => {
  const debts = await pool.query(`
    SELECT 
      d.*,
      o.order_id,
      (SELECT invoice_number FROM invoices WHERE order_id = d.order_id LIMIT 1) as invoice_number
    FROM customer_debts d
    LEFT JOIN orders o ON d.order_id = o.order_id
    WHERE d.user_id = ?
    ORDER BY d.created_at DESC
  `, [userId]);

  const balance = await getCustomerDebtBalance(userId);

  return {
    total_debt: balance,
    debts
  };
};

/**
 * إضافة دين جديد
 */
const addDebt = async (userId, orderId, amount, description = null) => {
  const result = await pool.query(`
    INSERT INTO customer_debts (user_id, order_id, amount, remaining, description)
    VALUES (?, ?, ?, ?, ?)
  `, [userId, orderId, amount, amount, description || `دين من طلب رقم ${orderId}`]);

  return result.insertId;
};

/**
 * تسجيل دفعة على دين
 */
const recordPayment = async (debtId, amount) => {
  // جلب الدين الحالي
  const debts = await pool.query(
    'SELECT * FROM customer_debts WHERE debt_id = ?',
    [debtId]
  );

  if (!debts.length) {
    const error = new Error('الدين غير موجود');
    error.status = 404;
    throw error;
  }

  const debt = debts[0];
  const newRemaining = parseFloat(debt.remaining) - parseFloat(amount);

  if (newRemaining < 0) {
    const error = new Error('المبلغ المدفوع أكبر من المتبقي');
    error.status = 400;
    throw error;
  }

  const newPaidAmount = parseFloat(debt.paid_amount) + parseFloat(amount);
  const newStatus = newRemaining === 0 ? 'paid' : 'partial';

  await pool.query(`
    UPDATE customer_debts 
    SET paid_amount = ?, remaining = ?, status = ?, updated_at = NOW()
    WHERE debt_id = ?
  `, [newPaidAmount, newRemaining, newStatus, debtId]);

  return {
    debt_id: debtId,
    paid_amount: newPaidAmount,
    remaining: newRemaining,
    status: newStatus
  };
};

/**
 * تسجيل دفعة على رصيد العميل (يدفع من أقدم الديون)
 */
const recordPaymentToBalance = async (userId, amount) => {
  // جلب الديون المستحقة مرتبة من الأقدم
  const debts = await pool.query(`
    SELECT * FROM customer_debts 
    WHERE user_id = ? AND status != 'paid'
    ORDER BY created_at ASC
  `, [userId]);

  let remainingPayment = parseFloat(amount);
  const payments = [];

  for (const debt of debts) {
    if (remainingPayment <= 0) break;

    const debtRemaining = parseFloat(debt.remaining);
    const paymentForThisDebt = Math.min(remainingPayment, debtRemaining);

    const result = await recordPayment(debt.debt_id, paymentForThisDebt);
    payments.push(result);

    remainingPayment -= paymentForThisDebt;
  }

  const newBalance = await getCustomerDebtBalance(userId);

  return {
    amount_paid: parseFloat(amount) - remainingPayment,
    excess_amount: remainingPayment > 0 ? remainingPayment : 0,
    new_balance: newBalance,
    payments
  };
};

/**
 * جلب ملخص ديون العملاء (للوحة التحكم)
 */
const getAllCustomersWithDebts = async () => {
  const customers = await pool.query(`
    SELECT 
      u.user_id,
      u.full_name,
      u.phone,
      u.customer_code,
      COALESCE(SUM(d.remaining), 0) as total_debt,
      COUNT(d.debt_id) as debts_count
    FROM users u
    LEFT JOIN customer_debts d ON u.user_id = d.user_id AND d.status != 'paid'
    WHERE u.role = 'customer'
    GROUP BY u.user_id
    HAVING total_debt > 0
    ORDER BY total_debt DESC
  `);

  return customers;
};

module.exports = {
  getCustomerDebtBalance,
  getDebtHistory,
  addDebt,
  recordPayment,
  recordPaymentToBalance,
  getAllCustomersWithDebts
};
