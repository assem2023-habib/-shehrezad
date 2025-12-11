/**
 * Cart Coupons Service
 * خدمة الكوبونات في السلة
 */

const pool = require('../../../../config/dbconnect');
const { CART_STATUS, HTTP_STATUS } = require('../../../../config/constants');

const applyCoupon = async (userId, code, itemId = null) => {
    const cart = await pool.query('SELECT cart_id FROM carts WHERE user_id = ? AND status = ?', [userId, CART_STATUS.ACTIVE]);
    if (!cart.length) {
        const error = new Error('لا توجد سلة فعالة');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    const couponRows = await pool.query(
        `SELECT * FROM coupons 
     WHERE code = ? 
       AND status = 'active'
       AND (start_date IS NULL OR start_date <= NOW())
       AND (end_date IS NULL OR end_date >= NOW())
       AND (usage_limit IS NULL OR used_count < usage_limit)`,
        [code]
    );

    if (!couponRows.length) {
        const error = new Error('الكوبون غير صالح');
        error.status = HTTP_STATUS.BAD_REQUEST;
        throw error;
    }

    const coupon = couponRows[0];

    if (coupon.target_audience === 'specific_users') {
        const allowed = await pool.query('SELECT 1 FROM coupon_customers WHERE coupon_id = ? AND user_id = ?', [coupon.coupon_id, userId]);
        if (!allowed.length) {
            const error = new Error('الكوبون غير مسموح لهذا المستخدم');
            error.status = HTTP_STATUS.FORBIDDEN;
            throw error;
        }
    }

    if (itemId) {
        const itemRows = await pool.query('SELECT ci.item_id, ci.product_id, ci.cart_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.cart_id WHERE ci.item_id = ? AND c.user_id = ? AND c.status = ?', [itemId, userId, CART_STATUS.ACTIVE]);
        if (!itemRows.length) {
            const error = new Error('العنصر غير موجود في سلة المستخدم');
            error.status = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        if (coupon.target_products_type === 'specific_products') {
            const prodAllowed = await pool.query('SELECT 1 FROM coupon_products WHERE coupon_id = ? AND product_id = ?', [coupon.coupon_id, itemRows[0].product_id]);
            if (!prodAllowed.length) {
                const error = new Error('الكوبون غير قابل للتطبيق على هذا المنتج');
                error.status = HTTP_STATUS.BAD_REQUEST;
                throw error;
            }
        }

        const exists = await pool.query('SELECT id FROM cart_applied_coupons WHERE cart_id = ? AND item_id = ? AND coupon_id = ?', [itemRows[0].cart_id, itemId, coupon.coupon_id]);
        if (exists.length) {
            return { applied: true, duplicate: true, scope: 'item', code };
        }

        await pool.query('INSERT INTO cart_applied_coupons (cart_id, item_id, coupon_id, user_id) VALUES (?, ?, ?, ?)', [itemRows[0].cart_id, itemId, coupon.coupon_id, userId]);
        return { applied: true, scope: 'item', code };
    } else {
        const exists = await pool.query('SELECT id FROM cart_applied_coupons WHERE cart_id = ? AND item_id IS NULL AND coupon_id = ?', [cart[0].cart_id, coupon.coupon_id]);
        if (exists.length) {
            return { applied: true, duplicate: true, scope: 'cart', code };
        }

        await pool.query('INSERT INTO cart_applied_coupons (cart_id, item_id, coupon_id, user_id) VALUES (?, NULL, ?, ?)', [cart[0].cart_id, coupon.coupon_id, userId]);
        return { applied: true, scope: 'cart', code };
    }
};

const getAppliedCoupons = async (userId) => {
    const cart = await pool.query('SELECT cart_id FROM carts WHERE user_id = ? AND status = ?', [userId, CART_STATUS.ACTIVE]);
    if (!cart.length) return { cart_coupons: [], items: [] };

    const cartCoupons = await pool.query('SELECT c.code FROM cart_applied_coupons cac JOIN coupons c ON cac.coupon_id = c.coupon_id WHERE cac.cart_id = ? AND cac.item_id IS NULL', [cart[0].cart_id]);
    const itemCoupons = await pool.query('SELECT cac.item_id, c.code FROM cart_applied_coupons cac JOIN coupons c ON cac.coupon_id = c.coupon_id WHERE cac.cart_id = ? AND cac.item_id IS NOT NULL', [cart[0].cart_id]);

    return {
        cart_coupons: cartCoupons.map(r => r.code),
        items: itemCoupons.reduce((acc, r) => {
            const found = acc.find(x => x.item_id === r.item_id);
            if (found) found.codes.push(r.code);
            else acc.push({ item_id: r.item_id, codes: [r.code] });
            return acc;
        }, [])
    };
};

const setItemBeneficiaries = async (userId, itemId, names = []) => {
    const item = await pool.query(
        'SELECT ci.item_id, c.user_id FROM cart_items ci JOIN carts c ON ci.cart_id = c.cart_id WHERE ci.item_id = ? AND c.user_id = ?',
        [itemId, userId]
    );

    if (!item.length) {
        const error = new Error('العنصر غير موجود');
        error.status = HTTP_STATUS.NOT_FOUND;
        throw error;
    }

    await pool.query('DELETE FROM cart_item_beneficiaries WHERE item_id = ?', [itemId]);
    const cleaned = (Array.isArray(names) ? names : []).map(n => String(n).trim()).filter(n => n.length > 0);

    for (const name of cleaned) {
        await pool.query('INSERT INTO cart_item_beneficiaries (item_id, beneficiary_name) VALUES (?, ?)', [itemId, name]);
    }

    const { getItemDetails } = require('./cart_helpers');
    return await getItemDetails(itemId);
};

module.exports = {
    applyCoupon,
    getAppliedCoupons,
    setItemBeneficiaries
};
