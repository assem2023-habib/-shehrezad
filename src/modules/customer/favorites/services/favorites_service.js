/**
 * Favorites Service - خدمة المفضلة
 */

const pool = require('../../../../config/dbconnect');

/**
 * إضافة منتج للمفضلة
 */
const addToFavorites = async (userId, productId) => {
  // التحقق من وجود المنتج
  const product = await pool.query(
    'SELECT product_id FROM products WHERE product_id = ?',
    [productId]
  );

  if (!product.length) {
    const error = new Error('المنتج غير موجود');
    error.status = 404;
    throw error;
  }

  // التحقق من عدم وجوده مسبقاً
  const existing = await pool.query(
    'SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing.length) {
    const error = new Error('المنتج موجود في المفضلة مسبقاً');
    error.status = 400;
    throw error;
  }

  const result = await pool.query(
    'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );

  return {
    favorite_id: result.insertId,
    product_id: productId
  };
};

/**
 * إزالة منتج من المفضلة
 */
const removeFromFavorites = async (userId, productId) => {
  const result = await pool.query(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('المنتج غير موجود في المفضلة');
    error.status = 404;
    throw error;
  }

  return { message: 'تمت الإزالة من المفضلة' };
};

/**
 * جلب قائمة المفضلة للعميل
 */
const getFavorites = async (userId) => {
  const favorites = await pool.query(`
    SELECT 
      f.favorite_id,
      f.created_at as added_at,
      p.product_id,
      p.product_code,
      p.product_name,
      p.product_category,
      p.price_usd,
      p.price_try,
      p.price_syp,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id AND is_main = 1 LIMIT 1) as main_image
    FROM favorites f
    JOIN products p ON f.product_id = p.product_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `, [userId]);

  return favorites;
};

/**
 * التحقق إذا كان المنتج في المفضلة
 */
const isFavorite = async (userId, productId) => {
  const result = await pool.query(
    'SELECT favorite_id FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  return result.length > 0;
};

/**
 * تبديل حالة المفضلة (toggle)
 */
const toggleFavorite = async (userId, productId) => {
  const exists = await isFavorite(userId, productId);

  if (exists) {
    await removeFromFavorites(userId, productId);
    return { is_favorite: false, message: 'تمت الإزالة من المفضلة' };
  } else {
    await addToFavorites(userId, productId);
    return { is_favorite: true, message: 'تمت الإضافة للمفضلة' };
  }
};

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  isFavorite,
  toggleFavorite
};
