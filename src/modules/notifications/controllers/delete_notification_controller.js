const notificationService = require('../../../services/notification_service');
const { sendSuccess, sendError, sendNotFound } = require('../../../config/response_helper');

/**
 * حذف إشعار من حساب المستخدم
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const notificationUserId = parseInt(req.params.id);

    if (!notificationUserId) {
      return sendError(res, 'معرّف الإشعار مطلوب', 400);
    }

    const success = await notificationService.deleteUserNotification(notificationUserId, userId);

    if (!success) {
      return sendNotFound(res, 'الإشعار غير موجود أو لا تملك صلاحية حذفه');
    }

    return sendSuccess(res, null, 'تم حذف الإشعار بنجاح');

  } catch (error) {
    console.error('[Delete Notification Controller] Error:', error);
    return sendError(res, 'حدث خطأ أثناء حذف الإشعار', 500);
  }
};

module.exports = { deleteNotification };
