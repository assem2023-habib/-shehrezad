/**
 * Customer Orders Routes
 * مسارات الطلبات للعملاء
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../../middleware/verifytoken');
const getOrdersController = require('../controllers/get_orders_controller');
const getOrderDetailsController = require('../controllers/get_order_details_controller');

router.use(verifyToken);

// جميع الطلبات - يجب تسجيل الدخول
router.get('/', getOrdersController);

// تفاصيل طلب محدد - يجب تسجيل الدخول
router.get('/:order_id', getOrderDetailsController);

module.exports = router;
