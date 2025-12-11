/**
 * Cart Operations Service
 * العمليات الأساسية على السلة
 */

const pool = require('../../../../config/dbconnect');
const { settingsService } = require('../../../../config/database');
const { CART_STATUS, SETTING_KEYS, HTTP_STATUS } = require('../../../../config/constants');
const { generateCartCode, getItemDetails } = require('./cart_helpers');

const getOrCreateCart = async (userId) => {
    const existingCart = await pool.query(
        'SELECT * FROM carts WHERE user_id = ? AND status = ?',
        [userId, CART_STATUS.ACTIVE]
    );

    if (existingCart.length > 0) {
        return existingCart[0];
    }

    const cartCode = await generateCartCode();

    const result = await pool.query(
        'INSERT INTO carts (user_id, cart_code, status) VALUES (?, ?, ?)',
        [userId, cartCode, CART_STATUS.ACTIVE]
    );

    return {
        cart_id: result.insertId,
        user_id: userId,
        cart_code: cartCode,
        status: CART_STATUS.ACTIVE,
        created_at: new Date()
    };
};

const addItem = async (userId, itemData) => {
    const { product_id, color_id, size_id, quantity = 1 } = itemData;

    const sizeInfo = await pool.query(
        'SELECT quantity FROM product_sizes WHERE size_id = ? AND color_id = ?',
        [size_id, color_id]
    );

    if (!sizeInfo.length || sizeInfo[0].quantity < quantity) {
        const error = new Error('الكمية المطلوبة غير متوفرة');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = await pool.query(
        `SELECT item_id, quantity, is_locked FROM cart_items 
     WHERE cart_id = ? AND product_id = ? AND color_id = ? AND size_id = ?`,
        [cart.cart_id, product_id, color_id, size_id]
    );

    if (existingItem.length > 0) {
        const newQuantity = existingItem[0].quantity + quantity;
        if (newQuantity > sizeInfo[0].quantity) {
            const error = new Error('الكمية المطلوبة غير متوفرة');
            error.status = HTTP_STATUS.BAD_REQUEST;
            throw error;
        }
        await pool.query(
            'UPDATE cart_items SET quantity = ? WHERE item_id = ?',
            [newQuantity, existingItem[0].item_id]
        );
        const itemDetails = await getItemDetails(existingItem[0].item_id);
        return { ...itemDetails, cart_code: cart.cart_code };
    }

    const maxItems = await settingsService.get(SETTING_KEYS.MAX_CART_ITEMS);
    const currentItems = await pool.query(
        'SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?',
        [cart.cart_id]
    );
    if (currentItems[0].count >= maxItems) {
        const error = new Error(`تجاوزت الحد الأقصى للعناصر (${maxItems})`);
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    const result = await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, color_id, size_id, quantity) 
     VALUES (?, ?, ?, ?, ?)`,
        [cart.cart_id, product_id, color_id, size_id, quantity]
    );

    const itemDetails = await getItemDetails(result.insertId);
    return { ...itemDetails, cart_code: cart.cart_code };
};

const removeItem = async (userId, itemId) => {
    const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

    const item = await pool.query(`
    SELECT ci.*, c.user_id, TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.cart_id
    WHERE ci.item_id = ? AND c.user_id = ?
  `, [itemId, userId]);

    if (!item.length) {
        const error = new Error('العنصر غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    const lockSeconds = lockMinutes * 60;
    if (item[0].seconds_since_added >= lockSeconds || item[0].is_locked) {
        const error = new Error('لا يمكن حذف العنصر بعد انتهاء المهلة الزمنية');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    await pool.query('DELETE FROM cart_items WHERE item_id = ?', [itemId]);
    return true;
};

const updateItem = async (userId, itemId, quantity) => {
    const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

    const item = await pool.query(`
    SELECT ci.*, c.user_id, c.cart_code, ps.quantity as available_quantity,
           TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN carts c ON ci.cart_id = c.cart_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.item_id = ? AND c.user_id = ?
  `, [itemId, userId]);

    if (!item.length) {
        const error = new Error('العنصر غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    const lockSeconds = lockMinutes * 60;
    if (item[0].seconds_since_added >= lockSeconds || item[0].is_locked) {
        const error = new Error('لا يمكن تعديل العنصر بعد انتهاء المهلة الزمنية');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    if (quantity > item[0].available_quantity) {
        const error = new Error('الكمية المطلوبة غير متوفرة');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    if (quantity <= 0) {
        return await removeItem(userId, itemId);
    }

    await pool.query(
        'UPDATE cart_items SET quantity = ? WHERE item_id = ?',
        [quantity, itemId]
    );

    const itemDetails = await getItemDetails(itemId);
    return { ...itemDetails, cart_code: item[0].cart_code };
};

const clearCart = async (userId) => {
    const cart = await pool.query(
        'SELECT cart_id FROM carts WHERE user_id = ? AND status = ?',
        [userId, CART_STATUS.ACTIVE]
    );
    if (!cart.length) {
        const error = new Error('لا توجد سلة فعالة');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }
    await pool.query('DELETE FROM cart_items WHERE cart_id = ? AND is_locked = 0', [cart[0].cart_id]);
    return true;
};

module.exports = {
    getOrCreateCart,
    addItem,
    removeItem,
    updateItem,
    clearCart
};
