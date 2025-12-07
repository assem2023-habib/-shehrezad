/**
 * Favorites Controller - متحكم المفضلة
 */

const favoritesService = require('../services/favorites_service');
const response = require('../../../../config/response_helper');

/**
 * جلب قائمة المفضلة
 * GET /api/favorites
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const favorites = await favoritesService.getFavorites(userId);
    return response.success(res, favorites);
  } catch (error) {
    console.error('Get Favorites Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب المفضلة');
  }
};

/**
 * إضافة منتج للمفضلة
 * POST /api/favorites/:product_id
 */
const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    const result = await favoritesService.addToFavorites(userId, parseInt(product_id));
    return response.created(res, result, 'تمت الإضافة للمفضلة');
  } catch (error) {
    console.error('Add to Favorites Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء الإضافة للمفضلة');
  }
};

/**
 * إزالة منتج من المفضلة
 * DELETE /api/favorites/:product_id
 */
const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    const result = await favoritesService.removeFromFavorites(userId, parseInt(product_id));
    return response.success(res, result);
  } catch (error) {
    console.error('Remove from Favorites Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء الإزالة من المفضلة');
  }
};

/**
 * تبديل حالة المفضلة
 * POST /api/favorites/:product_id/toggle
 */
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    const result = await favoritesService.toggleFavorite(userId, parseInt(product_id));
    return response.success(res, result);
  } catch (error) {
    console.error('Toggle Favorite Error:', error);
    return response.handleError(res, error, 'حدث خطأ');
  }
};

/**
 * التحقق إذا كان المنتج في المفضلة
 * GET /api/favorites/:product_id/check
 */
const checkFavorite = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    const isFavorite = await favoritesService.isFavorite(userId, parseInt(product_id));
    return response.success(res, { is_favorite: isFavorite });
  } catch (error) {
    console.error('Check Favorite Error:', error);
    return response.serverError(res, 'حدث خطأ');
  }
};

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  checkFavorite
};
