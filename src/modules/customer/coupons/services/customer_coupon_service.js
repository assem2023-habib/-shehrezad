/**
 * Customer Coupon Service
 * خدمة الكوبونات للعملاء (التحقق والتطبيق)
 */

const pool = require('../../../../config/dbconnect');

/**
 * التحقق من صلاحية الكوبون
 * @param {string} code - كود الكوبون
 * @param {number} userId - معرف المستخدم
 * @param {number} totalAmount - إجمالي السلة
 * @param {Array} cartItems - عناصر السلة (للتحقق من المنتجات المخصصة)
 */
const validateCoupon = async (code, userId, totalAmount, cartItems = []) => {
  // 1. جلب الكوبون
  const coupons = await pool.query('SELECT * FROM coupons WHERE code = ?', [code]);

  if (!coupons.length) {
    throw new Error('الكوبون غير موجود');
  }

  const coupon = coupons[0];

  // 2. التحقق من الحالة
  if (coupon.status !== 'active') {
    throw new Error('الكوبون غير فعال');
  }

  // 3. التحقق من التاريخ
  const now = new Date();
  if (coupon.start_date && now < new Date(coupon.start_date)) {
    throw new Error('الكوبون لم يبدأ بعد');
  }
  if (coupon.end_date && now > new Date(coupon.end_date)) {
    throw new Error('الكوبون منتهي الصلاحية');
  }

  // 4. التحقق من حد الاستخدام العام
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    throw new Error('تم تجاوز الحد الأقصى لاستخدام الكوبون');
  }

  // 5. التحقق من الحد الأدنى للشراء
  if (totalAmount < coupon.min_purchase_amount) {
    throw new Error(`يجب أن يكون إجمالي الطلب ${coupon.min_purchase_amount} على الأقل لاستخدام هذا الكوبون`);
  }

  // 6. التحقق من التخصيص للمستخدم
  if (coupon.target_audience === 'specific_users') {
    const userCheck = await pool.query(
      'SELECT 1 FROM coupon_customers WHERE coupon_id = ? AND user_id = ?',
      [coupon.coupon_id, userId]
    );
    if (!userCheck.length) {
      throw new Error('هذا الكوبون غير مخصص لك');
    }
  }

  // 7. حساب الخصم
  let discountAmount = 0;
  let applicableTotal = totalAmount;

  // التحقق من المنتجات المخصصة
  if (coupon.target_products_type === 'specific_products') {
    // جلب المنتجات المسموحة
    const allowedProducts = await pool.query(
      'SELECT product_id FROM coupon_products WHERE coupon_id = ?',
      [coupon.coupon_id]
    );
    const allowedProductIds = allowedProducts.map(p => p.product_id);

    // حساب مجموع المنتجات المسموحة فقط
    applicableTotal = cartItems.reduce((sum, item) => {
      if (allowedProductIds.includes(item.product_id)) {
        return sum + (item.price_try * item.quantity); // نفترض السعر بالليرة
      }
      return sum;
    }, 0);

    if (applicableTotal === 0) {
      throw new Error('الكوبون لا ينطبق على أي من المنتجات في سلتك');
    }
  }

  // حساب القيمة
  if (coupon.discount_type === 'percentage') {
    discountAmount = (applicableTotal * coupon.discount_value) / 100;
  } else {
    discountAmount = coupon.discount_value;
  }

  // التحقق من الحد الأقصى للخصم (للنسبة المئوية)
  if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
    discountAmount = coupon.max_discount_amount;
  }

  // التأكد من أن الخصم لا يتجاوز الإجمالي
  if (discountAmount > totalAmount) {
    discountAmount = totalAmount;
  }

  const couponObj = {
    coupon_id: coupon.coupon_id,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    max_discount_amount: coupon.max_discount_amount,
    min_purchase_amount: coupon.min_purchase_amount,
    usage_limit: coupon.usage_limit,
    used_count: coupon.used_count,
    start_date: coupon.start_date,
    end_date: coupon.end_date,
    target_audience: coupon.target_audience,
    target_products_type: coupon.target_products_type
  };

  return {
    valid: true,
    coupon: couponObj,
    discount_amount: parseFloat(discountAmount.toFixed(2)),
    final_total: parseFloat((totalAmount - discountAmount).toFixed(2))
  };
};

module.exports = {
  validateCoupon,
  getAssignedCoupons: async (userId) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const rows = await pool.query(`
      SELECT c.*
      FROM coupons c
      JOIN coupon_customers cc ON cc.coupon_id = c.coupon_id
      WHERE cc.user_id = ?
        AND c.status = 'active'
        AND (c.start_date IS NULL OR c.start_date <= ?)
        AND (c.end_date IS NULL OR c.end_date >= ?)
        AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
      ORDER BY c.end_date IS NULL DESC, c.end_date ASC
    `, [userId, now, now]);
    return rows;
  },
  getProductCouponsForUser: async (userId, productId = null) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (productId) {
      const rows = await pool.query(`
        SELECT DISTINCT c.*
        FROM coupons c
        LEFT JOIN coupon_customers cc ON cc.coupon_id = c.coupon_id AND cc.user_id = ?
        LEFT JOIN coupon_products cp ON cp.coupon_id = c.coupon_id
        WHERE c.status = 'active'
          AND (c.start_date IS NULL OR c.start_date <= ?)
          AND (c.end_date IS NULL OR c.end_date >= ?)
          AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
          AND (c.target_audience = 'all' OR cc.user_id IS NOT NULL)
          AND (c.target_products_type = 'all' OR cp.product_id = ?)
        ORDER BY c.end_date IS NULL DESC, c.end_date ASC
      `, [userId, now, now, productId]);
      return rows;
    } else {
      const rows = await pool.query(`
        SELECT DISTINCT c.*
        FROM coupons c
        LEFT JOIN coupon_customers cc ON cc.coupon_id = c.coupon_id AND cc.user_id = ?
        WHERE c.status = 'active'
          AND (c.start_date IS NULL OR c.start_date <= ?)
          AND (c.end_date IS NULL OR c.end_date >= ?)
          AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
          AND (c.target_audience = 'all' OR cc.user_id IS NOT NULL)
        ORDER BY c.end_date IS NULL DESC, c.end_date ASC
      `, [userId, now, now]);
      return rows;
    }
  },
  getCartApplicableCoupons: async (userId) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const carts = await pool.query('SELECT cart_id FROM carts WHERE user_id = ? AND status = "active"', [userId]);
    if (!carts.length) return [];
    const cartId = carts[0].cart_id;
    const items = await pool.query('SELECT DISTINCT product_id FROM cart_items WHERE cart_id = ?', [cartId]);
    if (!items.length) return [];
    const productIds = items.map(i => i.product_id);
    const rows = await pool.query(`
      SELECT DISTINCT c.*
      FROM coupons c
      LEFT JOIN coupon_customers cc ON cc.coupon_id = c.coupon_id AND cc.user_id = ?
      LEFT JOIN coupon_products cp ON cp.coupon_id = c.coupon_id
      WHERE c.status = 'active'
        AND (c.start_date IS NULL OR c.start_date <= ?)
        AND (c.end_date IS NULL OR c.end_date >= ?)
        AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
        AND (c.target_audience = 'all' OR cc.user_id IS NOT NULL)
        AND (c.target_products_type = 'all' OR cp.product_id IN (?))
      ORDER BY c.end_date IS NULL DESC, c.end_date ASC
    `, [userId, now, now, productIds]);
    return rows;
  }
};
