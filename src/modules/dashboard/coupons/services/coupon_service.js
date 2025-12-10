/**
 * Dashboard Coupon Service
 * خدمة إدارة الكوبونات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');

/**
 * إنشاء كوبون جديد
 */
const createCoupon = async (couponData) => {
  const {
    code,
    discount_type,
    discount_value,
    min_purchase_amount = 0,
    max_discount_amount = null,
    start_date = null,
    end_date = null,
    usage_limit = null,
    target_audience = 'all',
    target_products_type = 'all',
    customer_ids = [],
    product_ids = []
  } = couponData;

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

    // 1. إدخال الكوبون
    const result = await query(`
      INSERT INTO coupons (
        code, discount_type, discount_value, min_purchase_amount, 
        max_discount_amount, start_date, end_date, usage_limit, 
        target_audience, target_products_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code, discount_type, discount_value, min_purchase_amount,
      max_discount_amount, start_date, end_date, usage_limit,
      target_audience, target_products_type
    ]);

    const couponId = result.insertId;

    // 2. إدخال العملاء المخصصين
    if (target_audience === 'specific_users' && customer_ids.length > 0) {
      const customerValues = customer_ids.map(id => [couponId, id]);
      await query(
        'INSERT INTO coupon_customers (coupon_id, user_id) VALUES ?',
        [customerValues]
      );
    }

    // 3. إدخال المنتجات المخصصة
    if (target_products_type === 'specific_products' && product_ids.length > 0) {
      const productValues = product_ids.map(id => [couponId, id]);
      await query(
        'INSERT INTO coupon_products (coupon_id, product_id) VALUES ?',
        [productValues]
      );
    }

    await query('COMMIT');
    return { coupon_id: couponId, ...couponData };

  } catch (error) {
    await query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * جلب جميع الكوبونات
 */
const getAllCoupons = async (filters = {}) => {
  let sql = 'SELECT * FROM coupons ORDER BY created_at DESC';
  const coupons = await pool.query(sql);
  return coupons;
};

/**
 * جلب تفاصيل كوبون
 */
const getCouponById = async (couponId) => {
  const coupons = await pool.query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
  if (!coupons.length) return null;

  const coupon = coupons[0];

  // جلب العلاقات إذا وجدت
  if (coupon.target_audience === 'specific_users') {
    coupon.customers = await pool.query(`
      SELECT u.user_id, u.full_name, u.email 
      FROM coupon_customers cc
      JOIN users u ON cc.user_id = u.user_id
      WHERE cc.coupon_id = ?
    `, [couponId]);
  }

  if (coupon.target_products_type === 'specific_products') {
    coupon.products = await pool.query(`
      SELECT p.product_id, p.product_name, p.product_code
      FROM coupon_products cp
      JOIN products p ON cp.product_id = p.product_id
      WHERE cp.coupon_id = ?
    `, [couponId]);
  }

  return coupon;
};

/**
 * تحديث حالة الكوبون (تفعيل/إيقاف)
 */
const toggleStatus = async (couponId) => {
  const coupon = await pool.query('SELECT status FROM coupons WHERE coupon_id = ?', [couponId]);
  if (!coupon.length) throw new Error('الكوبون غير موجود');

  const newStatus = coupon[0].status === 'active' ? 'inactive' : 'active';
  await pool.query('UPDATE coupons SET status = ? WHERE coupon_id = ?', [newStatus, couponId]);
  
  return { coupon_id: couponId, status: newStatus };
};

/**
 * حذف كوبون
 */
const deleteCoupon = async (couponId) => {
  await pool.query('DELETE FROM coupons WHERE coupon_id = ?', [couponId]);
  return true;
};

module.exports = {
  createCoupon,
  getAllCoupons,
  getCouponById,
  toggleStatus,
  deleteCoupon,
  updateCoupon: async (couponId, data) => {
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

      const existingRows = await query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
      if (!existingRows.length) {
        throw new Error('الكوبون غير موجود');
      }

      const existing = existingRows[0];

      const allowedFields = [
        'code',
        'discount_type',
        'discount_value',
        'min_purchase_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'usage_limit',
        'target_audience',
        'target_products_type',
        'status'
      ];

      const setParts = [];
      const params = [];
      for (const f of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, f)) {
          setParts.push(`${f} = ?`);
          params.push(data[f]);
        }
      }

      if (setParts.length) {
        await query(`UPDATE coupons SET ${setParts.join(', ')} WHERE coupon_id = ?`, [...params, couponId]);
      }

      const audience = Object.prototype.hasOwnProperty.call(data, 'target_audience') ? data.target_audience : existing.target_audience;
      const productsType = Object.prototype.hasOwnProperty.call(data, 'target_products_type') ? data.target_products_type : existing.target_products_type;

      if (audience === 'specific_users') {
        if (Array.isArray(data.customer_ids)) {
          await query('DELETE FROM coupon_customers WHERE coupon_id = ?', [couponId]);
          if (data.customer_ids.length) {
            const values = data.customer_ids.map(id => [couponId, id]);
            await query('INSERT INTO coupon_customers (coupon_id, user_id) VALUES ?', [values]);
          }
        }
      } else {
        await query('DELETE FROM coupon_customers WHERE coupon_id = ?', [couponId]);
      }

      if (productsType === 'specific_products') {
        if (Array.isArray(data.product_ids)) {
          await query('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
          if (data.product_ids.length) {
            const values = data.product_ids.map(id => [couponId, id]);
            await query('INSERT INTO coupon_products (coupon_id, product_id) VALUES ?', [values]);
          }
        }
      } else {
        await query('DELETE FROM coupon_products WHERE coupon_id = ?', [couponId]);
      }

      await query('COMMIT');

      const updated = await query('SELECT * FROM coupons WHERE coupon_id = ?', [couponId]);
      const coupon = updated[0];

      if (coupon.target_audience === 'specific_users') {
        coupon.customers = await query(
          'SELECT u.user_id, u.full_name, u.email FROM coupon_customers cc JOIN users u ON cc.user_id = u.user_id WHERE cc.coupon_id = ?',
          [couponId]
        );
      }

      if (coupon.target_products_type === 'specific_products') {
        coupon.products = await query(
          'SELECT p.product_id, p.product_name, p.product_code FROM coupon_products cp JOIN products p ON cp.product_id = p.product_id WHERE cp.coupon_id = ?',
          [couponId]
        );
      }

      return coupon;

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }
};
