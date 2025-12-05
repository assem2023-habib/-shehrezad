/**
 * Profile Routes - مسارات الملف الشخصي
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const profileController = require('../controllers/profile_controller');
const upload = require('../../../../middleware/multer');

// حماية المسارات (العميل)
router.use(verifyToken);
router.use(checkRole(['customer']));

// المسارات
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/invoice-image', upload.single('image'), profileController.uploadInvoiceImage);

module.exports = router;
