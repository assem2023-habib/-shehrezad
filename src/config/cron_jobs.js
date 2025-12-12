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
 * إرسال تذكيرات الشحن وإنشاء طلبات تلقائية
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
      try {
        // 1. جلب عناصر السلة
        const items = await pool.query(`
          SELECT ci.*, p.price_usd, p.price_try, p.price_syp
          FROM cart_items ci
          JOIN products p ON ci.product_id = p.product_id
          WHERE ci.cart_id = ?
        `, [cart.cart_id]);

        if (items.length === 0) {
          console.log(`[CRON] Cart ${cart.cart_id} is empty, skipping`);
          continue;
        }

        // 2. حساب المجموع الكلي (بالليرة التركية كعملة افتراضية)
        let totalAmount = 0;
        for (const item of items) {
          totalAmount += parseFloat(item.price_try) * item.quantity;
        }

        // 3. إنشاء الطلب بحالة unpaid
        const orderResult = await pool.query(`
          INSERT INTO orders (user_id, total_amount, discount_amount, status, currency, customer_note, cart_note)
          VALUES (?, ?, 0, ?, 'TRY', NULL, 'طلب تلقائي تم إنشاؤه بعد انتهاء مدة السلة')
        `, [cart.user_id, totalAmount, ORDER_STATUS.UNPAID]);

        const orderId = orderResult.insertId;

        // 4. إضافة عناصر الطلب
        for (const item of items) {
          await pool.query(`
            INSERT INTO order_items (order_id, product_id, color_id, size_id, quantity, price_at_purchase)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [orderId, item.product_id, item.color_id, item.size_id, item.quantity, item.price_try]);
        }

        // 5. إنشاء الفاتورة
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const invoiceNumber = `INV-${dateStr}-${String(orderId).padStart(5, '0')}`;

        await pool.query(`
          INSERT INTO invoices (order_id, invoice_number, total_amount, status)
          VALUES (?, ?, ?, 'unpaid')
        `, [orderId, invoiceNumber, totalAmount]);

        // 6. إرسال إشعار للمستخدم
        await notificationService.sendToUsers({
          title: 'تم إنشاء طلبك',
          body: `مرحباً ${cart.customer_name}! تم إنشاء طلب تلقائي من سلتك (${cart.cart_code}). رقم الفاتورة: ${invoiceNumber}. يرجى المتابعة لإتمام الدفع.`,
          type: 'order_created',
          data: {
            order_id: orderId,
            invoice_number: invoiceNumber,
            cart_id: cart.cart_id,
            cart_code: cart.cart_code,
            total_amount: totalAmount,
            currency: 'TRY'
          },
          userIds: [cart.user_id]
        });

        // 7. تحديث حالة السلة
        await pool.query(
          'UPDATE carts SET reminder_sent = 1, status = ? WHERE cart_id = ?',
          [CART_STATUS.COMPLETED, cart.cart_id]
        );

        console.log(`[CRON] Created order ${orderId} (${invoiceNumber}) for cart ${cart.cart_id}`);

      } catch (itemError) {
        console.error(`[CRON] Error processing cart ${cart.cart_id}:`, itemError);
      }
    }

    if (pendingCarts.length > 0) {
      console.log(`[CRON] Processed ${pendingCarts.length} carts and created orders`);
    }

  } catch (error) {
    console.error('[CRON] Shipment Reminders Error:', error);
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

};

module.exports = {
  startCronJobs,
  lockExpiredItems,
  sendShipmentReminders
};
