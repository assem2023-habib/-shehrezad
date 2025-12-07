/**
 * Admin Routes
 * مسارات إدارة الأدمنز
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../config/constants');
const adminController = require('../controllers/admin_controller');

// إعداد Super Admin الأولي (بدون توكن - يعتمد على المفتاح السري)
router.post('/setup-admin', adminController.setupSuperAdmin);

module.exports = router;
