/**
 * Favorites Routes - مسارات المفضلة
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const favoritesController = require('../controllers/favorites_controller');

// جميع المسارات تتطلب توكن + عميل
router.use(verifyToken);
router.use(checkRole(['customer']));

// جلب قائمة المفضلة
router.get('/', favoritesController.getFavorites);

// إضافة منتج للمفضلة
router.post('/:product_id', favoritesController.addToFavorites);

// إزالة منتج من المفضلة
router.delete('/:product_id', favoritesController.removeFromFavorites);

// تبديل حالة المفضلة (toggle)
router.post('/:product_id/toggle', favoritesController.toggleFavorite);

// التحقق إذا كان المنتج في المفضلة
router.get('/:product_id/check', favoritesController.checkFavorite);

module.exports = router;
