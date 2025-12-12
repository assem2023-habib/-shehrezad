const notificationService = require('../../../services/notification_service');
const { success, error, notFound } = require('../../../config/response_helper');

/**
 * تعليم إشعار كمقروء
 * POST /api/notifications/read/:id
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const notificationUserId = parseInt(req.params.id);

    if (!notificationUserId) {
      return error(res, 'معرّف الإشعار مطلوب', 400);
    }

    const success = await notificationService.markAsRead(notificationUserId, userId);

    if (!success) {
      return notFound(res, 'الإشعار غير موجود أو لا تملك صلاحية الوصول إليه');
    }

    return success(res, null, 'تم تعليم الإشعار كمقروء بنجاح');

  } catch (error) {
    console.error('[Mark Read Controller] Error:', error);
    return error(res, 'حدث خطأ أثناء تحديث الإشعار', 500);
  }
};

/**
 * تعليم جميع الإشعارات كمقروءة
 * POST /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const affectedRows = await notificationService.markAllAsRead(userId);

    return success(res, { count: affectedRows }, `تم تعليم ${affectedRows} إشعار كمقروء`);

  } catch (error) {
    console.error('[Mark All Read Controller] Error:', error);
    return error(res, 'حدث خطأ أثناء تحديث الإشعارات', 500);
  }
};

module.exports = { markNotificationAsRead, markAllAsRead };
