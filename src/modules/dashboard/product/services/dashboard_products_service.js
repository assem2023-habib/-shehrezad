/**
 * Dashboard Products Service - خدمة المنتجات للوحة التحكم
 */

const pool = require('../../../../config/dbconnect');
const { PRODUCT_CATEGORIES } = require('../../../../config/constants');

/**
 * جلب جميع المنتجات (بما في ذلك المخفية) مع البحث والفلترة
 */
const getAllProducts = async (filters = {}) => {
  const { category, search, page = 1, limit = 20, availability_status } = filters;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.product_id,
      p.product_code,
      p.product_name,
      p.product_category,
      p.price_usd,
      p.price_try,
      p.price_syp,
      p.availability_status,
      p.created_at,
      p.updated_at,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as main_image,
      (SELECT SUM(ps.quantity) FROM product_colors pc 
        JOIN product_sizes ps ON pc.color_id = ps.color_id 
        WHERE pc.product_id = p.product_id) as total_stock
    FROM products p
    WHERE 1=1
  `;

  const params = [];

  if (availability_status) {
    query += ' AND p.availability_status = ?';
    params.push(availability_status);
  }

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

  // جلب العدد الكلي للصفحات
  let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
  const countParams = [];

  if (availability_status) {
    countQuery += ' AND p.availability_status = ?';
    countParams.push(availability_status);
  }

  if (category && Object.values(PRODUCT_CATEGORIES).includes(category)) {
    countQuery += ' AND p.product_category = ?';
    countParams.push(category);
  }

  if (search) {
    countQuery += ' AND (p.product_name LIKE ? OR p.product_code LIKE ?)';
    countParams.push(`%${search}%`, `%${search}%`);
  }

  const totalResult = await pool.query(countQuery, countParams);
  const total = totalResult[0].total;

  return {
    products: products.map(p => ({
      ...p,
      total_stock: parseInt(p.total_stock) || 0
    })),
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * جلب تفاصيل منتج واحد للوحة التحكم (مع كل التفاصيل)
 */
const getProductById = async (productId) => {
  // جلب المنتج
  const products = await pool.query(`
    SELECT * FROM products WHERE product_id = ?
  `, [productId]);

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
        quantity: s.quantity
      }))
    };
  }));

  // حساب إحصائيات التقييمات
  const reviewStats = await pool.query(`
    SELECT 
      COUNT(*) as review_count,
      AVG(rating) as average_rating,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reviews,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reviews
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
      u.customer_code,
      u.phone as customer_phone
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `, [productId]);

  return {
    ...product,
    images,
    colors: colorsWithSizes,
    review_statistics: {
      total_reviews: reviewStats[0].review_count || 0,
      average_rating: parseFloat(reviewStats[0].average_rating || 0).toFixed(1),
      pending_reviews: reviewStats[0].pending_reviews || 0,
      approved_reviews: reviewStats[0].approved_reviews || 0
    },
    reviews
  };
};

module.exports = {
  getAllProducts,
  getProductById
};
