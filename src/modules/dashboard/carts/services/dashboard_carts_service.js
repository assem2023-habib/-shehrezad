/**
 * Dashboard Carts Service - خدمة السلات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');
const settingsService = require('../../../../config/settings_service');
const { SETTING_KEYS, ORDER_STATUS, CART_STATUS } = require('../../../../config/constants');

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
      (SELECT SUM(quantity) FROM cart_items WHERE cart_id = c.cart_id) as total_quantity,
      (SELECT customer_note FROM orders WHERE user_id = c.user_id AND customer_note IS NOT NULL ORDER BY order_id DESC LIMIT 1) as previous_customer_note,
      (SELECT cart_note FROM orders WHERE user_id = c.user_id AND cart_note IS NOT NULL ORDER BY order_id DESC LIMIT 1) as previous_cart_note
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
  const itemIds = items.map(i => i.item_id);
  let beneficiariesMap = {};
  if (itemIds.length) {
    const benRows = await pool.query('SELECT item_id, beneficiary_name FROM cart_item_beneficiaries WHERE item_id IN (?)', [itemIds]);
    for (const r of benRows) {
      if (!beneficiariesMap[r.item_id]) beneficiariesMap[r.item_id] = [];
      beneficiariesMap[r.item_id].push(r.beneficiary_name);
    }
  }

  return items.map(item => ({
    ...item,
    is_locked: item.is_locked === 1,
    stock_deducted: item.stock_deducted === 1,
    lock_time_remaining: Math.max(0, lockSeconds - item.seconds_since_added),
    time_since_added: formatTimeSince(item.seconds_since_added),
    beneficiaries: beneficiariesMap[item.item_id] || []
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

  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);
  const lockSeconds = lockMinutes * 60;

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
      ps.size_value,
      TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.cart_id = ?
    ORDER BY ci.added_at DESC
  `, [cartId]);
  const itemIds = items.map(i => i.item_id);
  let beneficiariesMap = {};
  if (itemIds.length) {
    const benRows = await pool.query('SELECT item_id, beneficiary_name FROM cart_item_beneficiaries WHERE item_id IN (?)', [itemIds]);
    for (const r of benRows) {
      if (!beneficiariesMap[r.item_id]) beneficiariesMap[r.item_id] = [];
      beneficiariesMap[r.item_id].push(r.beneficiary_name);
    }
  }

  const debtsService = require('../../debts/services/debts_service');
  const customerCouponService = require('../../../customer/coupons/services/customer_coupon_service');
  const debtsSummary = await debtsService.getDebtsByCurrency(cart[0].user_id);
  const hasDebt = debtsSummary.some(d => d.amount > 0);

  let hasApplicableItemCoupon = false;
  const itemsApplicableCoupons = {};
  for (const it of items) {
    const coupons = await customerCouponService.getProductCouponsForUser(cart[0].user_id, it.product_id);
    itemsApplicableCoupons[it.item_id] = Array.isArray(coupons) ? coupons : [];
    if (itemsApplicableCoupons[it.item_id].length > 0) {
      hasApplicableItemCoupon = true;
    }
  }
  let cartApplicableCoupons = [];
  try {
    cartApplicableCoupons = await customerCouponService.getCartApplicableCoupons(cart[0].user_id);
  } catch (_) {
    cartApplicableCoupons = [];
  }

  const createdSeconds = Math.floor((Date.now() - new Date(cart[0].created_at).getTime()) / 1000);
  const prevNotes = await pool.query(`
    SELECT customer_note, cart_note, currency, order_id, created_at 
    FROM orders 
    WHERE user_id = ? AND (customer_note IS NOT NULL OR cart_note IS NOT NULL)
    ORDER BY order_id DESC
    LIMIT 1
  `, [cart[0].user_id]);
  const previous_customer_note = prevNotes.length ? prevNotes[0].customer_note : null;
  const previous_cart_note = prevNotes.length ? prevNotes[0].cart_note : null;
  const previous_note_currency = prevNotes.length ? prevNotes[0].currency : null;
  const previous_note_order_id = prevNotes.length ? prevNotes[0].order_id : null;
  const previous_note_created_at = prevNotes.length ? prevNotes[0].created_at : null;
  const responseData = {
    cart: { ...cart[0], time_since_created: formatTimeSince(createdSeconds) },
    has_debt: hasDebt,
    debts_summary: debtsSummary,
    previous_customer_note,
    previous_cart_note,
    previous_note_currency,
    previous_note_order_id,
    previous_note_created_at,
    items: items.map(it => ({
      ...it,
      beneficiaries: beneficiariesMap[it.item_id] || [],
      time_since_added: formatTimeSince(it.seconds_since_added),
      lock_time_remaining: Math.max(0, lockSeconds - it.seconds_since_added)
    })),
    cart_applicable_coupons: cartApplicableCoupons,
    items_applicable_coupons: itemsApplicableCoupons,
    has_applicable_item_coupon: hasApplicableItemCoupon,
    has_item_with_coupon_applied: false
  };
  return responseData;
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
const confirmCartByCode = async (
  cartCode,
  employeeId,
  paidAmount = 0,
  shippingAddress = null,
  paymentMethod = 'cod',
  currency = 'TRY',
  customerNote = null,
  cartNote = null,
  grandTotalOverride = null
) => {
  const debtsService = require('../../debts/services/debts_service');

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

  // 2. تحقق من الموظف المؤكد (قد تكون قاعدة البيانات خالية)
  const confirmer = await pool.query('SELECT user_id FROM users WHERE user_id = ? AND role IN (\'super_admin\', \'employee\')', [employeeId]);
  const confirmedBy = confirmer.length ? employeeId : null;

  // 3. جلب عناصر السلة
  const items = await pool.query(`
    SELECT ci.*, p.price_usd, p.price_try, p.price_syp, ps.quantity as available_qty
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

  // 4. اعتماد المجموع الكلي القادم من الطلب مباشرة
  const finalTotal = grandTotalOverride !== null && !Number.isNaN(parseFloat(grandTotalOverride))
    ? Math.max(0, parseFloat(grandTotalOverride))
    : (() => {
      let sum = 0;
      for (const item of items) {
        const unitPrice = currency === 'USD' ? item.price_usd : currency === 'SYP' ? item.price_syp : item.price_try;
        sum += parseFloat(unitPrice) * item.quantity;
      }
      return sum;
    })();

  // 5. جلب الديون السابقة للعميل بنفس العملة
  const previousDebt = await debtsService.getCustomerDebtBalance(cart.user_id, currency);
  const discountAmount = 0; // إلغاء الكوبون على مستوى السلة

  // 7. إنشاء الطلب
  const safePaymentMethod = ['cod', 'online'].includes(paymentMethod) ? paymentMethod : 'cod';
  const orderResult = await pool.query(`
    INSERT INTO orders (user_id, total_amount, discount_amount, coupon_id, status, confirmed_by, shipping_address, payment_method, currency, customer_note, cart_note)
    VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
  `, [cart.user_id, finalTotal, discountAmount, ORDER_STATUS.UNPAID, confirmedBy, shippingAddress, safePaymentMethod, currency, customerNote, cartNote]);

  const orderId = orderResult.insertId;

  // 7. إضافة عناصر الطلب
  for (const item of items) {
    const priceAtPurchase = currency === 'USD' ? item.price_usd : currency === 'SYP' ? item.price_syp : item.price_try;
    await pool.query(`
      INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [orderId, item.product_id, item.color_id, item.size_id, item.quantity, priceAtPurchase]);
  }

  // 8. إنشاء رقم الفاتورة
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceNumber = `INV-${dateStr}-${String(orderId).padStart(5, '0')}`;

  // 9. إنشاء الفاتورة
  await pool.query(`
    INSERT INTO invoices (order_id, invoice_number, total_amount, status)
    VALUES (?, ?, ?, 'unpaid')
  `, [orderId, invoiceNumber, finalTotal]);

  // 10. منطق الدفع/الدين حسب المدخلات
  const submittedPaid = Number.isNaN(parseFloat(paidAmount)) ? 0 : parseFloat(paidAmount);
  let paidToCurrentOrder = 0;
  let paidToOldDebts = 0;
  let excessPayment = 0;
  let newDebtFromOrder = 0;

  if (submittedPaid >= finalTotal) {
    // دفع قيمة الطلب كاملة ثم توجيه الباقي لسداد الديون القديمة، ثم اعتبار زيادة إن وجدت
    paidToCurrentOrder = finalTotal;
    const remainingPayment = submittedPaid - finalTotal;
    if (remainingPayment > 0) {
      if (previousDebt > 0) {
        const payRes = await debtsService.recordPaymentToBalance(cart.user_id, remainingPayment, currency);
        paidToOldDebts = payRes.amount_paid;
        excessPayment = payRes.excess_amount || 0;
      } else {
        excessPayment = remainingPayment;
      }
    }
    newDebtFromOrder = 0;
  } else {
    // دفعة أقل من قيمة الطلب: إنشاء/زيادة دين للطلب الحالي فقط
    paidToCurrentOrder = submittedPaid;
    newDebtFromOrder = Math.max(0, finalTotal - submittedPaid);
    if (newDebtFromOrder > 0) {
      await debtsService.addDebt(cart.user_id, orderId, newDebtFromOrder, `دين من طلب ${invoiceNumber}`, currency);
    }
    excessPayment = 0;
  }

  // 11. تفريغ السلة وإغلاقها
  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.cart_id]);
  await pool.query('UPDATE carts SET status = ? WHERE cart_id = ?', [CART_STATUS.COMPLETED, cart.cart_id]);

  // جلب الرصيد الجديد
  const finalDebt = await debtsService.getCustomerDebtBalance(cart.user_id, currency);

  return {
    order_id: orderId,
    invoice_number: invoiceNumber,
    final_total: finalTotal,
    discount_amount: discountAmount,
    previous_debt: previousDebt,
    paid_amount: submittedPaid,
    paid_to_previous_debts: paidToOldDebts,
    paid_to_current_order: paidToCurrentOrder,
    new_debt: newDebtFromOrder,
    final_balance: finalDebt,
    excess_payment: excessPayment || 0,
    currency,
    payment_method: paymentMethod,
    customer_name: cart.full_name,
    items_count: items.length
  };
};

module.exports = {
  getAllCarts,
  getAllCartItems,
  getPendingCarts,
  getCartDetails,
  confirmCartByCode,
  createCartAdmin: async (userId, status = 'active', items = []) => {
    // إذا كانت هناك سلة نشطة للعميل، أضف العناصر إليها بدلاً من إنشاء سلة جديدة
    const existing = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = ?',
      [userId, CART_STATUS.ACTIVE]
    );

    let cartId;

    if (existing.length) {
      cartId = existing[0].cart_id;
    } else {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const lastCart = await pool.query(
        'SELECT cart_code FROM carts WHERE cart_code LIKE ? ORDER BY cart_id DESC LIMIT 1',
        [`CART-${dateStr}-%`]
      );
      let sequence = 1;
      if (lastCart.length > 0 && lastCart[0].cart_code) {
        const lastNum = lastCart[0].cart_code.split('-')[2];
        sequence = parseInt(lastNum) + 1;
      }
      const cartCode = `CART-${dateStr}-${String(sequence).padStart(5, '0')}`;
      const result = await pool.query(
        'INSERT INTO carts (user_id, cart_code, status) VALUES (?, ?, ?)',
        [userId, cartCode, CART_STATUS.ACTIVE]
      );
      cartId = result.insertId;
    }

    for (const it of items) {
      const qty = Math.max(1, parseInt(it.quantity) || 1);
      await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, color_id, size_id, quantity) VALUES (?, ?, ?, ?, ?)`,
        [cartId, it.product_id, it.color_id, it.size_id, qty]
      );
    }

    return await getCartDetails(cartId);
  },
  updateCartAdmin: async (cartId, payload) => {
    const updates = [];
    const params = [];

    if (payload.status) {
      updates.push('status = ?');
      params.push(payload.status);
    }
    if (payload.user_id) {
      updates.push('user_id = ?');
      params.push(payload.user_id);
    }

    if (updates.length) {
      params.push(cartId);
      await pool.query(`UPDATE carts SET ${updates.join(', ')} WHERE cart_id = ?`, params);
    }

    if (Array.isArray(payload.remove_item_ids) && payload.remove_item_ids.length) {
      for (const itemId of payload.remove_item_ids) {
        const rows = await pool.query(
          'SELECT item_id, size_id, quantity, is_locked, stock_deducted FROM cart_items WHERE cart_id = ? AND item_id = ?',
          [cartId, itemId]
        );
        if (!rows.length) continue;
        const it = rows[0];
        if (it.is_locked === 1 && it.stock_deducted === 1) {
          await pool.query(
            'UPDATE product_sizes SET quantity = quantity + ? WHERE size_id = ?',
            [it.quantity, it.size_id]
          );
        }
        await pool.query('DELETE FROM cart_items WHERE item_id = ?', [itemId]);
      }
    }

    if (Array.isArray(payload.update_items)) {
      for (const it of payload.update_items) {
        if (!it.item_id) continue;
        const qty = Math.max(1, parseInt(it.quantity) || 1);
        await pool.query('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND item_id = ?', [qty, cartId, it.item_id]);
      }
    }

    if (Array.isArray(payload.add_items)) {
      for (const it of payload.add_items) {
        const qty = Math.max(1, parseInt(it.quantity) || 1);
        await pool.query(
          `INSERT INTO cart_items (cart_id, product_id, color_id, size_id, quantity) VALUES (?, ?, ?, ?, ?)`,
          [cartId, it.product_id, it.color_id, it.size_id, qty]
        );
      }
    }

    if (Array.isArray(payload.beneficiaries_updates)) {
      for (const bu of payload.beneficiaries_updates) {
        if (!bu.item_id) continue;
        await pool.query('DELETE FROM cart_item_beneficiaries WHERE item_id = ?', [bu.item_id]);
        const names = Array.isArray(bu.beneficiaries) ? bu.beneficiaries : [];
        for (const name of names.map(n => String(n).trim()).filter(n => n.length > 0)) {
          await pool.query('INSERT INTO cart_item_beneficiaries (item_id, beneficiary_name) VALUES (?, ?)', [bu.item_id, name]);
        }
      }
    }

    return await getCartDetails(cartId);
  },
  deleteCartAdmin: async (cartId) => {
    const items = await pool.query(
      'SELECT size_id, quantity, is_locked, stock_deducted FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
    for (const it of items) {
      if (it.is_locked === 1 && it.stock_deducted === 1) {
        await pool.query(
          'UPDATE product_sizes SET quantity = quantity + ? WHERE size_id = ?',
          [it.quantity, it.size_id]
        );
      }
    }
    await pool.query('DELETE FROM carts WHERE cart_id = ?', [cartId]);
    return true;
  }
};
