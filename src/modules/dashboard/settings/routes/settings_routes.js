/**
 * Settings Routes - مسارات الإعدادات
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const settingsController = require('../controllers/settings_controller');

// جميع المسارات تتطلب توكن + super_admin فقط
router.use(verifyToken);
router.use(checkRole([USER_ROLES.SUPER_ADMIN]));

// جلب الإعدادات
router.get('/', settingsController.getAllSettings);

// تحديث أرقام موظفي قسم الاستعلام
router.put('/inquiry-numbers', settingsController.updateInquiryNumbers);

// تحديث أرقام موظفي الدعم
router.put('/support-numbers', settingsController.updateSupportNumbers);

// تحديث بيانات الحساب البنكي
router.put('/bank-account', settingsController.updateBankAccount);

// تحديث إعداد عام بمفتاح
router.put('/:key', settingsController.updateSetting);

module.exports = router;
