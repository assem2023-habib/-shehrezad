/**
 * Cart Routes - مسارات السلة
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const cartController = require('../controllers/cart_controller');

// جميع المسارات تتطلب توكن + دور customer
router.use(verifyToken);
router.use(checkRole([USER_ROLES.CUSTOMER]));

// إضافة للسلة
router.post('/add', cartController.addToCart);

// عرض السلة
router.get('/', cartController.getCart);

// حذف عنصر
router.delete('/remove/:item_id', cartController.removeFromCart);

// تحديث كمية
router.put('/update/:item_id', cartController.updateCartItem);

module.exports = router;
