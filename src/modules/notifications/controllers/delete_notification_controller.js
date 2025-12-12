const notificationService = require('../../../services/notification_service');
const { success, error, notFound } = require('../../../config/response_helper');

/**
 * حذف إشعار من حساب المستخدم
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const notificationUserId = parseInt(req.params.id);

    if (!notificationUserId) {
      return error(res, 'معرّف الإشعار مطلوب', 400);
    }

    const success = await notificationService.deleteUserNotification(notificationUserId, userId);

    if (!success) {
      return notFound(res, 'الإشعار غير موجود أو لا تملك صلاحية حذفه');
    }

    return success(res, null, 'تم حذف الإشعار بنجاح');

  } catch (error) {
    console.error('[Delete Notification Controller] Error:', error);
    return error(res, 'حدث خطأ أثناء حذف الإشعار', 500);
  }
};

module.exports = { deleteNotification };
