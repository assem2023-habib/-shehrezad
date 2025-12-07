/**
 * Customers Routes - مسارات العملاء
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const customersController = require('../controllers/customers_controller');

const upload = require('../../../../middleware/multer');

// جميع المسارات تتطلب توكن + employee أو super_admin
router.use(verifyToken);
router.use(checkRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]));

// إضافة عميل
router.post('/', upload.single('image'), customersController.createCustomer);

// تحديث بيانات عميل
router.put('/:id', customersController.updateCustomer);

// حذف عميل
router.delete('/:id', customersController.deleteCustomer);

// جلب جميع العملاء
router.get('/', customersController.getAllCustomers);

// أحدث العملاء
router.get('/latest', customersController.lastAddedCustomersController);

// جلب تفاصيل عميل
router.get('/:id', customersController.getCustomerById);

module.exports = router;
