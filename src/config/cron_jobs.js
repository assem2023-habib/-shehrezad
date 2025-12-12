/**
 * Cron Jobs - المهام الآلية
 * قفل العناصر بعد المؤقت + تذكير الشحن
 */

const cron = require('node-cron');
const pool = require('./dbconnect');
const { settingsService } = require('./database');
const { SETTING_KEYS, CART_STATUS, DEFAULT_SETTINGS, ORDER_STATUS } = require('./constants');
const notificationService = require('../services/notification_service');


/**
 * قفل العناصر المنتهية الصلاحية وخصم المخزون
 * يعمل كل دقيقة
 */
const lockExpiredItems = async () => {
  try {
    const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

    // جلب العناصر غير المقفلة التي تجاوزت المدة
    const expiredItems = await pool.query(`
      SELECT ci.item_id, ci.size_id, ci.quantity, c.cart_code, u.full_name as customer_name
      FROM cart_items ci
      JOIN carts c ON ci.cart_id = c.cart_id
      JOIN users u ON c.user_id = u.user_id
      WHERE ci.is_locked = 0
        AND c.status = ?
        AND TIMESTAMPDIFF(MINUTE, ci.added_at, NOW()) >= ?
    `, [CART_STATUS.ACTIVE, lockMinutes]);

    for (const item of expiredItems) {
      // قفل العنصر
      await pool.query(
        'UPDATE cart_items SET is_locked = 1 WHERE item_id = ?',
        [item.item_id]
      );

      // خصم المخزون
      await pool.query(
        'UPDATE product_sizes SET quantity = quantity - ? WHERE size_id = ? AND quantity >= ?',
        [item.quantity, item.size_id, item.quantity]
      );

      // تحديث stock_deducted
      await pool.query(
        'UPDATE cart_items SET stock_deducted = 1 WHERE item_id = ?',
        [item.item_id]
      );

      // إرسال إشعار للمدير بالحجز الجديد
      try {
        await notificationService.sendToAdmin({
          title: 'حجز جديد!',
          body: `تم حجز منتج بواسطة ${item.customer_name} - رمز السلة: ${item.cart_code}`,
          type: 'product_reserved',
          data: {
            cart_code: item.cart_code,
            customer_name: item.customer_name,
            item_id: item.item_id,
            size_id: item.size_id,
            quantity: item.quantity
          }
        });
      } catch (notifError) {
        console.error('[CRON] Notification Error:', notifError);
      }

      console.log(`[CRON] Locked item ${item.item_id} and deducted stock`);

    }

    if (expiredItems.length > 0) {
      console.log(`[CRON] Locked ${expiredItems.length} items`);
    }

  } catch (error) {
    console.error('[CRON] Lock Items Error:', error);
  }
};

/**
 * إرسال تذكيرات الشحن
 * يعمل كل يوم الساعة 9 صباحاً
 */
const sendShipmentReminders = async () => {
  try {
    const reminderSetting = await settingsService.get(SETTING_KEYS.CART_REMINDER_DAYS);
    const reminderDays = Number.isFinite(parseInt(reminderSetting)) && parseInt(reminderSetting) > 0
      ? parseInt(reminderSetting)
      : DEFAULT_SETTINGS[SETTING_KEYS.CART_REMINDER_DAYS];

    // جلب السلات التي تجاوزت المدة ولم يُرسل لها تذكير
    const pendingCarts = await pool.query(`
      SELECT c.cart_id, c.user_id, c.cart_code, u.full_name as customer_name
      FROM carts c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.status = ?
        AND c.reminder_sent = 0
        AND DATEDIFF(NOW(), c.created_at) >= ?
    `, [CART_STATUS.ACTIVE, reminderDays]);

    for (const cart of pendingCarts) {
      // إنشاء إشعار
      await pool.query(`
        INSERT INTO notifications (user_id, title, body, type)
        VALUES (?, ?, ?, 'cart_reminder')
      `, [
        cart.user_id,
        'تذكير بالشحن',
        'مرحباً! مضى أكثر من 15 يوم على سلتك. يرجى التواصل معنا لترتيب الشحن.'
      ]);

      // تحديث حالة التذكير
      await pool.query(
        'UPDATE carts SET reminder_sent = 1, status = ? WHERE cart_id = ?',
        [CART_STATUS.PENDING_SHIPMENT, cart.cart_id]
      );

      try {
        const admin = await getAdmin();
        await admin.messaging().send({
          notification: {
            title: 'تذكير بالشحن',
            body: `مرحباً ${cart.customer_name}! مضى أكثر من ${reminderDays} يوم على سلتك (${cart.cart_code}). يرجى التواصل معنا لترتيب الشحن.`
          },
          topic: `user_${cart.user_id}`
        });
      } catch (e) {
        console.error('FCM Error:', e);
      }

      console.log(`[CRON] Sent reminder for cart ${cart.cart_id}`);
    }

    if (pendingCarts.length > 0) {
      console.log(`[CRON] Sent ${pendingCarts.length} reminders`);
    }

  } catch (error) {
    console.error('[CRON] Shipment Reminders Error:', error);
  }
};

/**
 * حذف الطلبات القديمة (المعلقة) وإعادة الكمية للمخزون
 * يعمل كل يوم الساعة 12 ليلاً
 */
const deleteStaleOrders = async () => {
  try {
    const reminderDays = await settingsService.get(SETTING_KEYS.CART_REMINDER_DAYS);

    // جلب الطلبات غير المدفوعة/المعلقة القديمة
    const staleOrders = await pool.query(
      'SELECT o.order_id FROM orders o WHERE o.status IN (?, ?) AND DATEDIFF(NOW(), o.created_at) >= ?',
      [ORDER_STATUS.UNPAID, ORDER_STATUS.PENDING, reminderDays]
    );

    for (const order of staleOrders) {
      // جلب عناصر الطلب
      const orderItems = await pool.query(`
        SELECT product_id, size_id, quantity FROM order_items WHERE order_id = ?
      `, [order.order_id]);

      // إعادة الكمية للمخزون
      for (const item of orderItems) {
        await pool.query(
          'UPDATE product_sizes SET quantity = quantity + ? WHERE size_id = ?',
          [item.quantity, item.size_id]
        );
      }

      // حذف الطلب (سيتم حذف العناصر والفاتورة تلقائياً بسبب ON DELETE CASCADE)
      await pool.query('DELETE FROM orders WHERE order_id = ?', [order.order_id]);

      console.log(`[CRON] Deleted stale order ${order.order_id} and restored stock`);
    }

    if (staleOrders.length > 0) {
      console.log(`[CRON] Deleted ${staleOrders.length} stale orders`);
    }

  } catch (error) {
    console.error('[CRON] Delete Stale Orders Error:', error);
  }
};

/**
 * بدء المهام الآلية
 */
const startCronJobs = () => {
  // قفل العناصر كل دقيقة
  cron.schedule('* * * * *', lockExpiredItems);
  console.log('[CRON] Item lock job scheduled (every minute)');

  // تذكيرات الشحن كل يوم الساعة 9 صباحاً
  cron.schedule('0 9 * * *', sendShipmentReminders);
  console.log('[CRON] Shipment reminders job scheduled (daily at 9 AM)');

  // حذف الطلبات القديمة كل يوم الساعة 12 ليلاً
  cron.schedule('0 0 * * *', deleteStaleOrders);
  console.log('[CRON] Stale orders cleanup job scheduled (daily at midnight)');
};

module.exports = {
  startCronJobs,
  lockExpiredItems,
  sendShipmentReminders,
  deleteStaleOrders
};
