/**
 * Dashboard Carts Routes - مسارات السلات للوحة التحكم
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const dashboardCartsController = require('../controllers/dashboard_carts_controller');

// جميع المسارات تتطلب توكن + دور employee أو accountant أو super_admin
router.use(verifyToken);
router.use(checkRole([USER_ROLES.ADMIN, USER_ROLES.ACCOUNTANT, USER_ROLES.SUPER_ADMIN]));

// جميع السلات
router.get('/', dashboardCartsController.getAllCarts);

// العرض الفوري - جميع العناصر
router.get('/items', dashboardCartsController.getAllCartItems);

// السلات الجاهزة للشحن
router.get('/pending', dashboardCartsController.getPendingCarts);

// تأكيد السلة بالكود - (محاسب أو أدمن فقط)
router.post('/confirm', checkRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]), dashboardCartsController.confirmCartByCode);

// تفاصيل سلة محددة
router.get('/:cart_id', dashboardCartsController.getCartDetails);

module.exports = router;
