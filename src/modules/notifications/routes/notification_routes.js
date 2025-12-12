/**
 * Notification Routes - مسارات الإشعارات
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../../middleware/verifytoken');

// Controllers
const { getUserNotifications } = require('../controllers/get_notifications_controller');
const { markNotificationAsRead, markAllAsRead } = require('../controllers/mark_read_controller');
const { deleteNotification } = require('../controllers/delete_notification_controller');

// جميع المسارات تتطلب توكن (يمكن للعملاء والمدراء استخدامها)
router.use(verifyToken);

/**
 * GET /api/notifications
 * جلب إشعارات المستخدم الحالي
 * Query params:
 *   - limit: عدد النتائج (افتراضي: 50)
 *   - offset: الإزاحة للصفحات (افتراضي: 0)
 *   - unread_only: true/false (افتراضي: false)
 */
router.get('/', getUserNotifications);

/**
 * POST /api/notifications/read/:id
 * تعليم إشعار كمقروء
 */
router.post('/read/:id', markNotificationAsRead);

/**
 * POST /api/notifications/read-all
 * تعليم جميع الإشعارات كمقروءة
 */
router.post('/read-all', markAllAsRead);

/**
 * DELETE /api/notifications/:id
 * حذف إشعار من حساب المستخدم
 */
router.delete('/:id', deleteNotification);

module.exports = router;
