/**
 * Products Routes - مسارات المنتجات للعميل
 */

const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products_controller');

// جلب جميع المنتجات (عام - بدون توكن)
router.get('/', productsController.getAllProducts);

// جلب منتجات حسب التصنيف
router.get('/category/:category', productsController.getProductsByCategory);

// جلب تفاصيل منتج
router.get('/:id', productsController.getProductById);

module.exports = router;
