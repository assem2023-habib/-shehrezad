/**
 * Dashboard Orders Routes
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const ordersController = require('../controllers/dashboard_orders_controller');
const invoiceController = require('../controllers/invoice_controller');

// جميع المسارات تتطلب توكن + employee/super_admin
router.use(verifyToken);
router.use(checkRole(['super_admin', 'employee']));

// عرض الطلبات
router.get('/', ordersController.getAllOrders);

// تفاصيل طلب
router.get('/:id', ordersController.getOrderById);

// تحديث حالة طلب
router.put('/:id/status', ordersController.updateOrderStatus);

// توليد فاتورة PDF (تحميل)
router.get('/:id/invoice', invoiceController.generateInvoice);

// عرض فاتورة PDF في المتصفح
router.get('/:id/invoice/view', invoiceController.viewInvoice);

module.exports = router;
