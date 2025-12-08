/**
 * خدمة السلة - Cart Service
 * المنطق الأساسي للتعامل مع السلة
 */

const pool = require('../../../../config/dbconnect');
const settingsService = require('../../../../config/settings_service');
const { CART_STATUS, SETTING_KEYS, HTTP_STATUS, ORDER_STATUS } = require('../../../../config/constants');

/**
 * توليد كود فريد للسلة
 * Format: CART-YYYYMMDD-XXXXX (e.g., CART-20241204-00001)
 */
const generateCartCode = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

  // الحصول على آخر كود لهذا اليوم
  const lastCart = await pool.query(
    'SELECT cart_code FROM carts WHERE cart_code LIKE ? ORDER BY cart_id DESC LIMIT 1',
    [`CART-${dateStr}-%`]
  );

  let sequence = 1;
  if (lastCart.length > 0 && lastCart[0].cart_code) {
    const lastNum = lastCart[0].cart_code.split('-')[2];
    sequence = parseInt(lastNum) + 1;
  }

  return `CART-${dateStr}-${String(sequence).padStart(5, '0')}`;
};

/**
 * الحصول على سلة المستخدم أو إنشاء واحدة جديدة
 */
const getOrCreateCart = async (userId) => {
  // البحث عن سلة موجودة
  const existingCart = await pool.query(
    'SELECT * FROM carts WHERE user_id = ? AND status = ?',
    [userId, CART_STATUS.ACTIVE]
  );

  if (existingCart.length > 0) {
    return existingCart[0];
  }

  // توليد كود السلة
  const cartCode = await generateCartCode();

  // إنشاء سلة جديدة
  const result = await pool.query(
    'INSERT INTO carts (user_id, cart_code, status) VALUES (?, ?, ?)',
    [userId, cartCode, CART_STATUS.ACTIVE]
  );

  return {
    cart_id: result.insertId,
    user_id: userId,
    cart_code: cartCode,
    status: CART_STATUS.ACTIVE,
    created_at: new Date()
  };
};

/**
 * إضافة عنصر للسلة
 */
const addItem = async (userId, itemData) => {
  const { product_id, color_id, size_id, quantity = 1 } = itemData;

  // التحقق من توفر المخزون
  const sizeInfo = await pool.query(
    'SELECT quantity FROM product_sizes WHERE size_id = ? AND color_id = ?',
    [size_id, color_id]
  );

  if (!sizeInfo.length || sizeInfo[0].quantity < quantity) {
    const error = new Error('الكمية المطلوبة غير متوفرة');
    error.status = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // التحقق من الحد الأقصى للعناصر
  const maxItems = await settingsService.get(SETTING_KEYS.MAX_CART_ITEMS);
  const cart = await getOrCreateCart(userId);

  const currentItems = await pool.query(
    'SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?',
    [cart.cart_id]
  );

  if (currentItems[0].count >= maxItems) {
    const error = new Error(`تجاوزت الحد الأقصى للعناصر (${maxItems})`);
    error.status = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  // التحقق من عدم وجود نفس العنصر
  const existingItem = await pool.query(
    `SELECT item_id, quantity, is_locked FROM cart_items 
     WHERE cart_id = ? AND product_id = ? AND color_id = ? AND size_id = ?`,
    [cart.cart_id, product_id, color_id, size_id]
  );

  if (existingItem.length > 0) {
    // إذا كان مقفلاً، أضف عنصر جديد
    if (existingItem[0].is_locked) {
      // إضافة عنصر جديد
    } else {
      // تحديث الكمية
      const newQuantity = existingItem[0].quantity + quantity;
      if (newQuantity > sizeInfo[0].quantity) {
        const error = new Error('الكمية المطلوبة غير متوفرة');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
      }

      await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE item_id = ?',
        [newQuantity, existingItem[0].item_id]
      );

      const itemDetails = await getItemDetails(existingItem[0].item_id);
      return { ...itemDetails, cart_code: cart.cart_code };
    }
  }

  // إضافة عنصر جديد
  const result = await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, color_id, size_id, quantity) 
     VALUES (?, ?, ?, ?, ?)`,
    [cart.cart_id, product_id, color_id, size_id, quantity]
  );

  const itemDetails = await getItemDetails(result.insertId);
  return { ...itemDetails, cart_code: cart.cart_code };
};

/**
 * الحصول على تفاصيل عنصر
 */
const getItemDetails = async (itemId) => {
  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

  const rows = await pool.query(`
    SELECT 
      ci.item_id,
      ci.quantity,
      ci.is_locked,
      ci.added_at,
      p.product_id,
      p.product_name,
      p.product_code,
      pc.color_id,
      pc.color_name,
      pc.color_value,
      ps.size_id,
      ps.size_value,
      TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.item_id = ?
  `, [itemId]);

  if (!rows.length) return null;

  const item = rows[0];
  const lockSeconds = lockMinutes * 60;
  const remainingSeconds = Math.max(0, lockSeconds - item.seconds_since_added);

  const beneficiaries = await pool.query(
    'SELECT beneficiary_name FROM cart_item_beneficiaries WHERE item_id = ? ORDER BY beneficiary_id',
    [itemId]
  );

  return {
    item_id: item.item_id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_code: item.product_code,
    color_id: item.color_id,
    color_name: item.color_name,
    color_value: item.color_value,
    size_id: item.size_id,
    size_value: item.size_value,
    quantity: item.quantity,
    is_locked: item.is_locked === 1,
    added_at: item.added_at,
    lock_time_remaining: remainingSeconds,
    beneficiaries: beneficiaries.map(b => b.beneficiary_name)
  };
};

/**
 * الحصول على سلة المستخدم مع جميع العناصر
 */
const getCart = async (userId) => {
  const cart = await pool.query(
    'SELECT * FROM carts WHERE user_id = ? AND status = ?',
    [userId, CART_STATUS.ACTIVE]
  );

  if (!cart.length) {
    return { cart: null, cart_code: null, items: [] };
  }

  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

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
  `, [cart[0].cart_id]);

  const lockSeconds = lockMinutes * 60;

  const itemIds = items.map(i => i.item_id);
  let beneficiariesMap = {};
  if (itemIds.length) {
    const beneficiariesMapRows = await pool.query(
      'SELECT item_id, beneficiary_name FROM cart_item_beneficiaries WHERE item_id IN (?)',
      [itemIds]
    );
    for (const r of beneficiariesMapRows) {
      if (!beneficiariesMap[r.item_id]) beneficiariesMap[r.item_id] = [];
      beneficiariesMap[r.item_id].push(r.beneficiary_name);
    }
  }

  return {
    cart: {
      cart_id: cart[0].cart_id,
      cart_code: cart[0].cart_code,
      user_id: cart[0].user_id,
      status: cart[0].status,
      created_at: cart[0].created_at,
      updated_at: cart[0].updated_at
    },
    cart_code: cart[0].cart_code,
    items: items.map(item => ({
      item_id: item.item_id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_code: item.product_code,
      color_name: item.color_name,
      color_value: item.color_value,
      size_value: item.size_value,
      quantity: item.quantity,
      price_usd: item.price_usd,
      price_try: item.price_try,
      price_syp: item.price_syp,
      is_locked: item.is_locked === 1,
      added_at: item.added_at,
      lock_time_remaining: Math.max(0, lockSeconds - item.seconds_since_added),
      beneficiaries: beneficiariesMap[item.item_id] || []
    }))
  };
};

/**
 * حذف عنصر من السلة
 */
const removeItem = async (userId, itemId) => {
  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

  // التحقق من أن العنصر يخص المستخدم
  const item = await pool.query(`
    SELECT ci.*, c.user_id, TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.cart_id
    WHERE ci.item_id = ? AND c.user_id = ?
  `, [itemId, userId]);

  if (!item.length) {
    const error = new Error('العنصر غير موجود');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }

  // التحقق من انتهاء وقت القفل
  const lockSeconds = lockMinutes * 60;
  if (item[0].seconds_since_added >= lockSeconds || item[0].is_locked) {
    const error = new Error('لا يمكن حذف العنصر بعد انتهاء المهلة الزمنية');
    error.status = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  await pool.query('DELETE FROM cart_items WHERE item_id = ?', [itemId]);
  return true;
};

/**
 * تحديث كمية عنصر
 */
const updateItem = async (userId, itemId, quantity) => {
  const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

  // التحقق من أن العنصر يخص المستخدم
  const item = await pool.query(`
    SELECT ci.*, c.user_id, c.cart_code, ps.quantity as available_quantity,
           TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.cart_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.item_id = ? AND c.user_id = ?
  `, [itemId, userId]);

  if (!item.length) {
    const error = new Error('العنصر غير موجود');
    error.status = HTTP_STATUS.NOT_FOUND;
    throw error;
  }

  // التحقق من انتهاء وقت القفل
  const lockSeconds = lockMinutes * 60;
  if (item[0].seconds_since_added >= lockSeconds || item[0].is_locked) {
    const error = new Error('لا يمكن تعديل العنصر بعد انتهاء المهلة الزمنية');
    error.status = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (quantity > item[0].available_quantity) {
    const error = new Error('الكمية المطلوبة غير متوفرة');
    error.status = HTTP_STATUS.BAD_REQUEST;
    throw error;
  }

  if (quantity <= 0) {
    return await removeItem(userId, itemId);
  }

  await pool.query(
    'UPDATE cart_items SET quantity = ? WHERE item_id = ?',
    [quantity, itemId]
  );

  const itemDetails = await getItemDetails(itemId);
  return { ...itemDetails, cart_code: item[0].cart_code };
};

const getUnlockedItems = async (userId) => {
  const orders = await pool.query(`
    SELECT 
      o.order_id,
      o.status,
      o.total_amount,
      o.discount_amount,
      o.payment_method,
      o.currency,
      o.shipping_address,
      o.created_at,
      i.invoice_number,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS items_count
    FROM orders o
    LEFT JOIN invoices i ON i.order_id = o.order_id
    WHERE o.user_id = ? AND o.status NOT IN (?, ?)
    ORDER BY o.created_at DESC
  `, [userId, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED]);
  return { orders };
};

const getLockedItems = async (userId) => {
  const orders = await pool.query(`
    SELECT 
      o.order_id,
      o.status,
      o.total_amount,
      o.discount_amount,
      o.payment_method,
      o.currency,
      o.shipping_address,
      o.created_at,
      i.invoice_number,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS items_count
    FROM orders o
    LEFT JOIN invoices i ON i.order_id = o.order_id
    WHERE o.user_id = ? AND o.status = ?
    ORDER BY o.created_at DESC
  `, [userId, ORDER_STATUS.DELIVERED]);
  return { orders };
};

module.exports = {
  getOrCreateCart,
  addItem,
  getCart,
  removeItem,
  updateItem,
  getItemDetails,
  clearCart: async (userId) => {
    const cart = await pool.query(
      'SELECT cart_id FROM carts WHERE user_id = ? AND status = ?',
      [userId, CART_STATUS.ACTIVE]
    );
    if (!cart.length) {
      const error = new Error('لا توجد سلة فعالة');
      error.status = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    await pool.query('DELETE FROM cart_items WHERE cart_id = ? AND is_locked = 0', [cart[0].cart_id]);
    return true;
  },
  setItemBeneficiaries: async (userId, itemId, names = []) => {
    const item = await pool.query(
      'SELECT ci.item_id, c.user_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.cart_id WHERE ci.item_id = ? AND c.user_id = ?',
      [itemId, userId]
    );
    if (!item.length) {
      const error = new Error('العنصر غير موجود');
      error.status = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    await pool.query('DELETE FROM cart_item_beneficiaries WHERE item_id = ?', [itemId]);
    const cleaned = (Array.isArray(names) ? names : []).map(n => String(n).trim()).filter(n => n.length > 0);
    for (const name of cleaned) {
      await pool.query('INSERT INTO cart_item_beneficiaries (item_id, beneficiary_name) VALUES (?, ?)', [itemId, name]);
    }
    return await getItemDetails(itemId);
  },
  getUnlockedItems,
  getLockedItems
};
