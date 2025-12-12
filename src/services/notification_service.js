const pool = require('../config/dbconnect');
const { getAdmin } = require('../firebase');

/**
 * Notification Service
 * خدمة مركزية لإدارة الإشعارات
 */

class NotificationService {
  /**
   * إنشاء إشعار جديد في الجدول الرئيسي
   * @param {Object} notificationData - بيانات الإشعار
   * @param {string} notificationData.title - عنوان الإشعار
   * @param {string} notificationData.body - نص الإشعار
   * @param {string} notificationData.type - نوع الإشعار
   * @param {Object} notificationData.data - بيانات إضافية (JSON)
   * @returns {Promise<number>} - معرّف الإشعار
   */
  async createNotification({ title, body, type, data = null }) {
    try {
      const result = await pool.query(
        `INSERT INTO notifications (title, body, type, data) VALUES (?, ?, ?, ?)`,
        [title, body, type, data ? JSON.stringify(data) : null]
      );
      return result.insertId;
    } catch (error) {
      console.error('[NotificationService] Create Error:', error);
      throw error;
    }
  }

  /**
   * ربط إشعار بمستخدمين محددين
   * @param {number} notificationId - معرّف الإشعار
   * @param {Array<number>} userIds - قائمة معرفات المستخدمين
   */
  async linkNotificationToUsers(notificationId, userIds) {
    try {
      if (!userIds || userIds.length === 0) {
        console.warn('[NotificationService] No users to link');
        return;
      }

      const values = userIds.map(userId => [notificationId, userId]);
      await pool.query(
        `INSERT INTO notification_users (notification_id, user_id) VALUES ?`,
        [values]
      );
    } catch (error) {
      console.error('[NotificationService] Link Users Error:', error);
      throw error;
    }
  }

  /**
   * جلب جميع المستخدمين (عدا الأدمنز إذا كان مطلوب)
   * @param {boolean} excludeAdmins - استثناء الأدمنز
   * @returns {Promise<Array<number>>} - قائمة معرفات المستخدمين
   */
  async getAllUserIds(excludeAdmins = false) {
    try {
      let query = 'SELECT user_id FROM users';
      if (excludeAdmins) {
        query += " WHERE role = 'customer'";
      }
      const users = await pool.query(query);
      return users.map(user => user.user_id);
    } catch (error) {
      console.error('[NotificationService] Get All Users Error:', error);
      throw error;
    }
  }

  /**
   * جلب معرفات المدراء والـ Super Admin
   * @returns {Promise<Array<number>>} - قائمة معرفات المدراء
   */
  async getAdminUserIds() {
    try {
      const admins = await pool.query(
        "SELECT user_id FROM users WHERE role IN ('super_admin', 'employee')"
      );
      return admins.map(admin => admin.user_id);
    } catch (error) {
      console.error('[NotificationService] Get Admins Error:', error);
      throw error;
    }
  }

  /**
   * إرسال إشعار Firebase
   * @param {Object} params - معاملات الإرسال
   * @param {string} params.title - عنوان الإشعار
   * @param {string} params.body - نص الإشعار
   * @param {string} params.topic - Topic للإرسال (all_users, dashboard_notifications, user_{id})
   * @param {Object} params.data - بيانات إضافية
   */
  async sendFirebaseNotification({ title, body, topic, data = null }) {
    try {
      const admin = await getAdmin();
      const message = {
        notification: { title, body },
        topic
      };

      if (data) {
        message.data = {};
        // تحويل جميع القيم إلى strings (Firebase requirement)
        for (const [key, value] of Object.entries(data)) {
          message.data[key] = String(value);
        }
      }

      await admin.messaging().send(message);
      console.log(`[NotificationService] FCM sent to topic: ${topic}`);
    } catch (error) {
      // FCM errors should not break the flow
      console.error('[NotificationService] FCM Error:', error.message);
    }
  }

  /**
   * إرسال إشعار لجميع المستخدمين
   * @param {Object} params - بيانات الإشعار
   * @param {string} params.title - عنوان الإشعار
   * @param {string} params.body - نص الإشعار
   * @param {string} params.type - نوع الإشعار
   * @param {Object} params.data - بيانات إضافية
   * @param {boolean} params.customersOnly - إرسال للعملاء فقط (بدون الأدمنز)
   */
  async sendToAllUsers({ title, body, type, data = null, customersOnly = true }) {
    let connection;
    try {
      connection = await pool.getConnectionAsync();
      await connection.queryAsync('START TRANSACTION');

      // إنشاء الإشعار
      const notificationResult = await connection.queryAsync(
        `INSERT INTO notifications (title, body, type, data) VALUES (?, ?, ?, ?)`,
        [title, body, type, data ? JSON.stringify(data) : null]
      );
      const notificationId = notificationResult.insertId;

      // جلب المستخدمين
      let userQuery = 'SELECT user_id FROM users';
      if (customersOnly) {
        userQuery += " WHERE role = 'customer'";
      }
      const users = await connection.queryAsync(userQuery);

      if (users.length > 0) {
        // ربط الإشعار بالمستخدمين
        const values = users.map(user => [notificationId, user.user_id]);
        await connection.queryAsync(
          `INSERT INTO notification_users (notification_id, user_id) VALUES ?`,
          [values]
        );
      }

      await connection.queryAsync('COMMIT');

      // إرسال Firebase
      await this.sendFirebaseNotification({
        title,
        body,
        topic: 'all_users',
        data
      });

      console.log(`[NotificationService] Sent to ${users.length} users`);
      return notificationId;
    } catch (error) {
      if (connection) await connection.queryAsync('ROLLBACK');
      console.error('[NotificationService] Send to All Error:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * إرسال إشعار للمدراء فقط
   * @param {Object} params - بيانات الإشعار
   */
  async sendToAdmin({ title, body, type, data = null }) {
    let connection;
    try {
      connection = await pool.getConnectionAsync();
      await connection.queryAsync('START TRANSACTION');

      // إنشاء الإشعار
      const notificationResult = await connection.queryAsync(
        `INSERT INTO notifications (title, body, type, data) VALUES (?, ?, ?, ?)`,
        [title, body, type, data ? JSON.stringify(data) : null]
      );
      const notificationId = notificationResult.insertId;

      // جلب المدراء
      const admins = await connection.queryAsync(
        "SELECT user_id FROM users WHERE role IN ('super_admin', 'employee')"
      );

      if (admins.length > 0) {
        // ربط الإشعار بالمدراء
        const values = admins.map(admin => [notificationId, admin.user_id]);
        await connection.queryAsync(
          `INSERT INTO notification_users (notification_id, user_id) VALUES ?`,
          [values]
        );
      }

      await connection.queryAsync('COMMIT');

      // إرسال Firebase
      await this.sendFirebaseNotification({
        title,
        body,
        topic: 'dashboard_notifications',
        data
      });

      console.log(`[NotificationService] Sent to ${admins.length} admins`);
      return notificationId;
    } catch (error) {
      if (connection) await connection.queryAsync('ROLLBACK');
      console.error('[NotificationService] Send to Admin Error:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * إرسال إشعار لمستخدمين محددين
   * @param {Object} params - بيانات الإشعار
   * @param {Array<number>} params.userIds - قائمة معرفات المستخدمين
   */
  async sendToUsers({ title, body, type, data = null, userIds }) {
    let connection;
    try {
      if (!userIds || userIds.length === 0) {
        console.warn('[NotificationService] No users specified');
        return null;
      }

      connection = await pool.getConnectionAsync();
      await connection.queryAsync('START TRANSACTION');

      // إنشاء الإشعار
      const notificationResult = await connection.queryAsync(
        `INSERT INTO notifications (title, body, type, data) VALUES (?, ?, ?, ?)`,
        [title, body, type, data ? JSON.stringify(data) : null]
      );
      const notificationId = notificationResult.insertId;

      // ربط الإشعار بالمستخدمين
      const values = userIds.map(userId => [notificationId, userId]);
      await connection.queryAsync(
        `INSERT INTO notification_users (notification_id, user_id) VALUES ?`,
        [values]
      );

      await connection.queryAsync('COMMIT');

      // إرسال Firebase لكل مستخدم
      for (const userId of userIds) {
        await this.sendFirebaseNotification({
          title,
          body,
          topic: `user_${userId}`,
          data
        });
      }

      console.log(`[NotificationService] Sent to ${userIds.length} specific users`);
      return notificationId;
    } catch (error) {
      if (connection) await connection.queryAsync('ROLLBACK');
      console.error('[NotificationService] Send to Users Error:', error);
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * جلب إشعارات مستخدم معين
   * @param {number} userId - معرّف المستخدم
   * @param {Object} options - خيارات إضافية
   * @param {number} options.limit - الحد الأقصى للنتائج
   * @param {number} options.offset - الإزاحة للصفحات
   * @param {boolean} options.unreadOnly - جلب غير المقروءة فقط
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, unreadOnly = false } = options;

      let query = `
        SELECT 
          n.id,
          n.title,
          n.body,
          n.type,
          n.data,
          n.created_at,
          nu.is_read,
          nu.read_at,
          nu.id as notification_user_id
        FROM notifications n
        INNER JOIN notification_users nu ON n.id = nu.notification_id
        WHERE nu.user_id = ?
      `;

      const params = [userId];

      if (unreadOnly) {
        query += ' AND nu.is_read = 0';
      }

      query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const notifications = await pool.query(query, params);

      // تحويل data من JSON string إلى object
      return notifications.map(notif => ({
        ...notif,
        data: notif.data ? JSON.parse(notif.data) : null
      }));
    } catch (error) {
      console.error('[NotificationService] Get User Notifications Error:', error);
      throw error;
    }
  }

  /**
   * عدد الإشعارات غير المقروءة لمستخدم
   * @param {number} userId - معرّف المستخدم
   */
  async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count 
         FROM notification_users 
         WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
      return result[0].count;
    } catch (error) {
      console.error('[NotificationService] Get Unread Count Error:', error);
      throw error;
    }
  }

  /**
   * تعليم إشعار كمقروء
   * @param {number} notificationUserId - معرّف السجل في notification_users
   * @param {number} userId - معرّف المستخدم (للتحقق)
   */
  async markAsRead(notificationUserId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notification_users 
         SET is_read = 1, read_at = NOW() 
         WHERE id = ? AND user_id = ?`,
        [notificationUserId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[NotificationService] Mark as Read Error:', error);
      throw error;
    }
  }

  /**
   * تعليم جميع إشعارات مستخدم كمقروءة
   * @param {number} userId - معرّف المستخدم
   */
  async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        `UPDATE notification_users 
         SET is_read = 1, read_at = NOW() 
         WHERE user_id = ? AND is_read = 0`,
        [userId]
      );
      return result.affectedRows;
    } catch (error) {
      console.error('[NotificationService] Mark All as Read Error:', error);
      throw error;
    }
  }

  /**
   * حذف إشعار من حساب مستخدم
   * @param {number} notificationUserId - معرّف السجل في notification_users
   * @param {number} userId - معرّف المستخدم (للتحقق)
   */
  async deleteUserNotification(notificationUserId, userId) {
    try {
      const result = await pool.query(
        `DELETE FROM notification_users 
         WHERE id = ? AND user_id = ?`,
        [notificationUserId, userId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('[NotificationService] Delete User Notification Error:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
