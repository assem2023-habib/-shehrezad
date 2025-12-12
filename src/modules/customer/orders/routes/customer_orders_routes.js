/**
 * Customer Orders Routes
 * مسارات الطلبات للعملاء
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middleware/authenticate_token');
const getOrdersController = require('../controllers/get_orders_controller');
const getOrderDetailsController = require('../controllers/get_order_details_controller');

// جميع الطلبات - يجب تسجيل الدخول
router.get('/', authenticateToken, getOrdersController);

// تفاصيل طلب محدد - يجب تسجيل الدخول
router.get('/:order_id', authenticateToken, getOrderDetailsController);

module.exports = router;
