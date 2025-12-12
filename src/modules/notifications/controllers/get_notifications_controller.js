const notificationService = require('../../../services/notification_service');
const { sendSuccess, sendError, sendNotFound } = require('../../../config/response_helper');

/**
 * جلب إشعارات المستخدم الحالي
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit, offset, unread_only } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      unreadOnly: unread_only === 'true'
    };

    const notifications = await notificationService.getUserNotifications(userId, options);
    const unreadCount = await notificationService.getUnreadCount(userId);

    return sendSuccess(res, {
      notifications,
      unread_count: unreadCount,
      total: notifications.length
    }, 'تم جلب الإشعارات بنجاح');

  } catch (error) {
    console.error('[Get Notifications Controller] Error:', error);
    return sendError(res, 'حدث خطأ أثناء جلب الإشعارات', 500);
  }
};

module.exports = { getUserNotifications };
