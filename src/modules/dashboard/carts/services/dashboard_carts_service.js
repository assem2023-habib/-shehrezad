/**
 * Dashboard Carts Service - خدمة السلات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');
const settingsService = require('../../../../config/settings_service');
const { SETTING_KEYS } = require('../../../../config/constants');

/**
 * جلب جميع السلات الفعالة
 */
const getAllCarts = async () => {
  const carts = await pool.query(`
    SELECT 
      c.*,
      u.full_name as customer_name,
      u.phone as customer_phone,
      u.customer_code,
      (SELECT COUNT(*) FROM cart_items WHERE cart_id = c.cart_id) as items_count,
      (SELECT SUM(quantity) FROM cart_items WHERE cart_id = c.cart_id) as total_quantity
    FROM carts c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.status = 'active'
    ORDER BY c.updated_at DESC
  `);

  return carts;
};

/**
 * جلب جميع عناصر السلات - العرض الفوري
 */
const getAllCartItems = async () => {
  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);
  const lockSeconds = lockMinutes * 60;

  const items = await pool.query(`
    SELECT 
      ci.item_id,
      ci.quantity,
      ci.is_locked,
      ci.stock_deducted,
      ci.added_at,
      c.cart_id,
      c.cart_code,
      u.user_id,
      u.full_name as customer_name,
      u.phone as customer_phone,
      u.customer_code,
      p.product_id,
      p.product_name,
      p.product_code,
      pc.color_name,
      pc.color_value,
      ps.size_value,
      TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.cart_id
    JOIN users u ON c.user_id = u.user_id
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE c.status = 'active'
    ORDER BY ci.added_at DESC
  `);

  return items.map(item => ({
    ...item,
    is_locked: item.is_locked === 1,
    stock_deducted: item.stock_deducted === 1,
    lock_time_remaining: Math.max(0, lockSeconds - item.seconds_since_added),
    time_since_added: formatTimeSince(item.seconds_since_added)
  }));
};

/**
 * جلب السلات التي تجاوزت مدة التذكير
 */
const getPendingCarts = async () => {
  const reminderDays = await settingsService.get(SETTING_KEYS.CART_REMINDER_DAYS);

  const carts = await pool.query(`
    SELECT 
      c.*,
      u.full_name as customer_name,
      u.phone as customer_phone,
      u.customer_code,
      (SELECT COUNT(*) FROM cart_items WHERE cart_id = c.cart_id) as items_count,
      DATEDIFF(NOW(), c.created_at) as days_since_created
    FROM carts c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.status = 'active'
      AND DATEDIFF(NOW(), c.created_at) >= ?
    ORDER BY c.created_at ASC
  `, [reminderDays]);

  return carts;
};

/**
 * جلب تفاصيل سلة محددة
 */
const getCartDetails = async (cartId) => {
  const cart = await pool.query(`
    SELECT 
      c.*,
      u.full_name as customer_name,
      u.phone as customer_phone,
      u.customer_code,
      u.email as customer_email
    FROM carts c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.cart_id = ?
  `, [cartId]);

  if (!cart.length) return null;

  const items = await pool.query(`
    SELECT 
      ci.*,
      p.product_name,
      p.product_code,
      p.price_usd,
      p.price_try,
      p.price_syp,
      pc.color_name,
      pc.color_value,
      ps.size_value
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.cart_id = ?
    ORDER BY ci.added_at DESC
  `, [cartId]);

  return {
    cart: cart[0],
    items
  };
};

/**
 * تنسيق الوقت المنقضي
 */
const formatTimeSince = (seconds) => {
  if (seconds < 60) return `${seconds} ثانية`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعة`;
  return `${Math.floor(seconds / 86400)} يوم`;
};

/**
 * تأكيد السلة بالكود وإنشاء طلب - المحاسب فقط
 * مع نظام الديون
 */
const confirmCartByCode = async (cartCode, employeeId, paidAmount = 0, couponCode = null, shippingAddress = null, paymentMethod = 'cash') => {
  const debtsService = require('../../debts/services/debts_service');
  const customerCouponService = require('../../../customer/coupons/services/customer_coupon_service');

  // 1. جلب السلة بالكود
  const carts = await pool.query(`
    SELECT c.*, u.full_name, u.user_id
    FROM carts c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.cart_code = ? AND c.status = 'active'
  `, [cartCode.toUpperCase()]);

  if (!carts.length) {
    const error = new Error('السلة غير موجودة أو غير فعالة');
    error.status = 404;
    throw error;
  }

  const cart = carts[0];

  // 2. جلب عناصر السلة
  const items = await pool.query(`
    SELECT ci.*, p.price_try, ps.quantity as available_qty
    FROM cart_items ci
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.cart_id = ?
  `, [cart.cart_id]);

  if (!items.length) {
    const error = new Error('السلة فارغة');
    error.status = 400;
    throw error;
  }

  // 3. حساب تكلفة السلة
  let cartTotal = 0;
  for (const item of items) {
    cartTotal += parseFloat(item.price_try) * item.quantity;
  }

  // 4. جلب الديون السابقة
  const previousDebt = await debtsService.getCustomerDebtBalance(cart.user_id);

  // 5. معالجة الكوبون (إذا وجد)
  let discountAmount = 0;
  let couponId = null;
  let finalTotal = cartTotal;

  if (couponCode) {
    // التحقق من الكوبون
    const couponResult = await customerCouponService.validateCoupon(
      couponCode,
      cart.user_id,
      cartTotal,
      items
    );

    discountAmount = couponResult.discount_amount;
    finalTotal = couponResult.final_total;
    couponId = couponResult.coupon_id;

    // زيادة عداد استخدام الكوبون
    await pool.query(
      'UPDATE coupons SET used_count = used_count + 1 WHERE coupon_id = ?',
      [couponId]
    );
  }

  // 6. حساب الإجمالي الكلي (مع الديون السابقة)
  const grandTotal = finalTotal + previousDebt;

  // 7. إنشاء الطلب
  const orderResult = await pool.query(`
    INSERT INTO orders (user_id, total_amount, discount_amount, coupon_id, status, confirmed_by, shipping_address, payment_method)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
  `, [cart.user_id, finalTotal, discountAmount, couponId, employeeId, shippingAddress, paymentMethod]);

  const orderId = orderResult.insertId;

  // 7. إضافة عناصر الطلب
  for (const item of items) {
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [orderId, item.product_id, item.color_id, item.size_id, item.quantity, item.price_try]);
  }

  // 8. إنشاء رقم الفاتورة
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceNumber = `INV-${dateStr}-${String(orderId).padStart(5, '0')}`;

  // 9. إنشاء الفاتورة
  await pool.query(`
    INSERT INTO invoices (order_id, invoice_number, total_amount, status)
    VALUES (?, ?, ?, 'pending')
  `, [orderId, invoiceNumber, finalTotal]);

  // 10. حساب الدين الجديد
  const actualPaid = Math.min(parseFloat(paidAmount) || 0, grandTotal);
  const newDebt = grandTotal - actualPaid;

  // 11. تسجيل الدفعات على الديون القديمة (إن وجدت)
  let paidToOldDebts = 0;
  if (previousDebt > 0 && actualPaid > 0) {
    const paymentForOldDebts = Math.min(actualPaid, previousDebt);
    if (paymentForOldDebts > 0) {
      await debtsService.recordPaymentToBalance(cart.user_id, paymentForOldDebts);
      paidToOldDebts = paymentForOldDebts;
    }
  }

  // 12. إضافة دين جديد للطلب (إن تبقى)
  const remainingAfterOldDebts = actualPaid - paidToOldDebts;
  const debtFromThisOrder = finalTotal - remainingAfterOldDebts;
  
  if (debtFromThisOrder > 0) {
    await debtsService.addDebt(cart.user_id, orderId, debtFromThisOrder, `دين من طلب ${invoiceNumber}`);
  }

  // 13. تفريغ السلة
  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.cart_id]);
  await pool.query(`UPDATE carts SET status = 'completed' WHERE cart_id = ?`, [cart.cart_id]);

  // جلب الرصيد الجديد
  const finalDebt = await debtsService.getCustomerDebtBalance(cart.user_id);

  return {
    order_id: orderId,
    invoice_number: invoiceNumber,
    cart_total: cartTotal,
    discount_amount: discountAmount,
    final_total: finalTotal,
    coupon_applied: !!couponId,
    previous_debt: previousDebt,
    grand_total: grandTotal,
    paid_amount: actualPaid,
    new_debt: debtFromThisOrder > 0 ? debtFromThisOrder : 0,
    final_balance: finalDebt,
    customer_name: cart.full_name,
    items_count: items.length
  };
};

module.exports = {
  getAllCarts,
  getAllCartItems,
  getPendingCarts,
  getCartDetails,
  confirmCartByCode
};
