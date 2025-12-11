/**
 * Orders Operations Service
 * العمليات الأساسية على الطلبات
 */

const pool = require('../../../../config/dbconnect');
const { getConnection, createQuery, ORDER_STATUS } = require('./orders_helpers');

const updateOrderStatus = async (orderId, status) => {
    const allowedStatus = Object.values(ORDER_STATUS);
    if (!allowedStatus.includes(status)) {
        throw new Error('حالة الطلب غير صالحة');
    }

    const currentOrder = await pool.query(
        'SELECT status FROM orders WHERE order_id = ?',
        [orderId]
    );

    if (!currentOrder.length) {
        throw new Error('الطلب غير موجود');
    }

    const currentStatus = currentOrder[0].status;

    if (currentStatus === ORDER_STATUS.CANCELLED) {
        throw new Error('لا يمكن تغيير حالة طلب ملغي');
    }

    if (status === ORDER_STATUS.CANCELLED && currentStatus !== ORDER_STATUS.CANCELLED) {
        await restoreStock(orderId);
    }

    await pool.query(
        'UPDATE orders SET status = ? WHERE order_id = ?',
        [status, orderId]
    );

    return { order_id: orderId, status };
};

const restoreStock = async (orderId) => {
    const orderItems = await pool.query(
        'SELECT size_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
    );

    if (!orderItems.length) {
        return;
    }

    const connection = await getConnection();
    const query = createQuery(connection);

    try {
        await query('START TRANSACTION');

        for (const item of orderItems) {
            await query(
                'UPDATE product_sizes SET quantity = quantity + ? WHERE size_id = ?',
                [item.quantity, item.size_id]
            );
        }

        await query('COMMIT');
        console.log(`✅ تم إعادة المخزون للطلب رقم ${orderId}`);

    } catch (error) {
        await query('ROLLBACK');
        console.error(`❌ خطأ في إعادة المخزون للطلب ${orderId}:`, error);
        throw new Error('فشل في إعادة المخزون');
    } finally {
        connection.release();
    }
};

module.exports = {
    updateOrderStatus,
    restoreStock
};
