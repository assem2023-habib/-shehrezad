/**
 * Products Routes - مسارات المنتجات للعميل
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middleware/verifytoken');
const productsController = require('../controllers/products_controller');

// جلب جميع المنتجات (يتطلب توكن)
router.get('/', verifyToken, productsController.getAllProducts);

// جلب منتجات حسب التصنيف (يتطلب توكن)
router.get('/category/:category', verifyToken, productsController.getProductsByCategory);

// جلب تفاصيل منتج (يتطلب توكن)
router.get('/:id', verifyToken, productsController.getProductById);

module.exports = router;
