/**
 * Cart Helper Functions
 * دوال مساعدة للسلة
 */

const pool = require('../../../../config/dbconnect');
const { settingsService } = require('../../../../config/database');
const { SETTING_KEYS, HTTP_STATUS } = require('../../../../config/constants');

const generateCartCode = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const lastCart = await pool.query(
        'SELECT cart_code FROM carts WHERE cart_code LIKE ? ORDER BY cart_id DESC LIMIT 1',
        [`CART-${dateStr}-%`]
    );

    let sequence = 1;
    if (lastCart.length > 0 && lastCart[0].cart_code) {
        const lastNum = lastCart[0].cart_code.split('-')[2];
        sequence = parseInt(lastNum) + 1;
    }

    return `CART-${dateStr}-${String(sequence).padStart(5, '0')}`;
};

const getItemDetails = async (itemId) => {
    const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

    const rows = await pool.query(`
    SELECT 
      ci.item_id,
      ci.quantity,
      ci.is_locked,
      ci.added_at,
      p.product_id,
      p.product_name,
      p.product_code,
      pc.color_id,
      pc.color_name,
      pc.color_value,
      ps.size_id,
      ps.size_value,
      TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.item_id = ?
  `, [itemId]);

    if (!rows.length) return null;

    const item = rows[0];
    const lockSeconds = lockMinutes * 60;
    const remainingSeconds = Math.max(0, lockSeconds - item.seconds_since_added);

    const beneficiaries = await pool.query(
        'SELECT beneficiary_name FROM cart_item_beneficiaries WHERE item_id = ? ORDER BY beneficiary_id',
        [itemId]
    );

    return {
        item_id: item.item_id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        color_id: item.color_id,
        color_name: item.color_name,
        color_value: item.color_value,
        size_id: item.size_id,
        size_value: item.size_value,
        quantity: item.quantity,
        is_locked: item.is_locked === 1,
        added_at: item.added_at,
        lock_time_remaining: remainingSeconds,
        beneficiaries: beneficiaries.map(b => b.beneficiary_name)
    };
};

const calculateItemCouponDiscount = (price, coupon) => {
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
        discount = price * (parseFloat(coupon.discount_value) / 100);
    } else if (coupon.discount_type === 'fixed') {
        discount = Math.min(price, parseFloat(coupon.discount_value));
    }
    if (coupon.max_discount_amount != null) {
        discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
    }
    return discount;
};

module.exports = {
    generateCartCode,
    getItemDetails,
    calculateItemCouponDiscount
};
