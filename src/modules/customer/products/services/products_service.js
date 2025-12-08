/**
 * Products Service - خدمة المنتجات للعميل
 */

const pool = require('../../../../config/dbconnect');
const { PRODUCT_CATEGORIES, AVAILABILITY_STATUS } = require('../../../../config/constants');

/**
 * جلب جميع المنتجات مع حالة المخزون والخصومات
 */
const getAllProducts = async (filters = {}) => {
  const { category, search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.product_id,
      p.product_code,
      p.product_name,
      p.product_description,
      p.product_category,
      p.price_usd,
      p.price_try,
      p.price_syp,
      p.availability_status,
      p.is_show,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as main_image,
      (SELECT SUM(ps.quantity) FROM product_colors pc 
        JOIN product_sizes ps ON pc.color_id = ps.color_id 
        WHERE pc.product_id = p.product_id) as total_stock
    FROM products p
    WHERE p.availability_status = ? AND p.is_show = 1
  `;

  const params = [AVAILABILITY_STATUS.VISIBLE];

  if (category && Object.values(PRODUCT_CATEGORIES).includes(category)) {
    query += ' AND p.product_category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.product_name LIKE ? OR p.product_code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const products = await pool.query(query, params);

  // جلب الكوبونات المتاحة لكل منتج
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const productsWithCoupons = await Promise.all(products.map(async (p) => {
    const couponRows = await pool.query(`
      SELECT 
        c.coupon_id,
        c.code,
        c.discount_type,
        c.discount_value,
        c.max_discount_amount,
        c.min_purchase_amount,
        c.usage_limit,
        c.used_count,
        c.start_date,
        c.end_date,
        c.target_audience,
        c.target_products_type
      FROM coupons c
      LEFT JOIN coupon_products cp ON c.coupon_id = cp.coupon_id
      WHERE c.status = 'active'
        AND (c.start_date IS NULL OR c.start_date <= ?)
        AND (c.end_date IS NULL OR c.end_date >= ?)
        AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
        AND (c.target_products_type = 'all' OR cp.product_id = ?)
    `, [now, now, p.product_id]);

    return {
      ...p,
      is_available: p.total_stock > 0,
      total_stock: parseInt(p.total_stock) || 0,
      coupons: couponRows
    };
  }));

  return productsWithCoupons;
};

/**
 * جلب تفاصيل منتج واحد مع الألوان والمقاسات
 */
const getProductById = async (productId) => {
  // جلب المنتج
  const products = await pool.query(`
    SELECT 
      p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as main_image
    FROM products p
    WHERE p.product_id = ? AND p.availability_status = ?
  `, [productId, AVAILABILITY_STATUS.VISIBLE]);

  if (!products.length) return null;

  const product = products[0];

  // جلب الصور
  const images = await pool.query(
    'SELECT image_id, image_url, is_main FROM product_images WHERE product_id = ? ORDER BY is_main DESC',
    [productId]
  );

  // جلب الألوان مع المقاسات
  const colors = await pool.query(
    'SELECT * FROM product_colors WHERE product_id = ?',
    [productId]
  );

  const colorsWithSizes = await Promise.all(colors.map(async (color) => {
    const sizes = await pool.query(
      'SELECT size_id, size_value, quantity FROM product_sizes WHERE color_id = ?',
      [color.color_id]
    );

    return {
      color_id: color.color_id,
      color_name: color.color_name,
      color_value: color.color_value,
      sizes: sizes.map(s => ({
        size_id: s.size_id,
        size_value: s.size_value,
        quantity: s.quantity,
        is_available: s.quantity > 0
      }))
    };
  }));

  // حساب متوسط التقييم وعدد التقييمات
  const reviewStats = await pool.query(`
    SELECT 
      COUNT(*) as review_count,
      AVG(rating) as average_rating
    FROM reviews
    WHERE product_id = ?
  `, [productId]);

  const reviews = await pool.query(`
    SELECT 
      r.review_id,
      r.rating,
      r.comment,
      r.status,
      r.created_at,
      u.full_name as customer_name,
      u.customer_code
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `, [productId]);

  return {
    product_id: product.product_id,
    product_code: product.product_code,
    product_name: product.product_name,
    product_description: product.product_description,
    product_category: product.product_category,
    price_usd: product.price_usd,
    price_try: product.price_try,
    price_syp: product.price_syp,
    images,
    colors: colorsWithSizes,
    review_count: reviewStats[0].review_count || 0,
    average_rating: parseFloat(reviewStats[0].average_rating || 0).toFixed(1),
    reviews
    ,
    coupons: await pool.query(`
      SELECT 
        c.coupon_id,
        c.code,
        c.discount_type,
        c.discount_value,
        c.max_discount_amount,
        c.min_purchase_amount,
        c.usage_limit,
        c.used_count,
        c.start_date,
        c.end_date,
        c.target_audience,
        c.target_products_type
      FROM coupons c
      LEFT JOIN coupon_products cp ON c.coupon_id = cp.coupon_id
      WHERE c.status = 'active'
        AND (c.start_date IS NULL OR c.start_date <= NOW())
        AND (c.end_date IS NULL OR c.end_date >= NOW())
        AND (c.usage_limit IS NULL OR c.used_count < c.usage_limit)
        AND (c.target_products_type = 'all' OR cp.product_id = ?)
    `, [productId])
  };
};

/**
 * جلب المنتجات حسب التصنيف
 */
const getProductsByCategory = async (category, page = 1, limit = 20) => {
  return getAllProducts({ category, page, limit });
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory
};
