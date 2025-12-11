/**
 * Cart Retrieval Service
 * خدمة استرجاع بيانات السلة
 */

const pool = require('../../../../config/dbconnect');
const { settingsService } = require('../../../../config/database');
const { CART_STATUS, SETTING_KEYS, ORDER_STATUS } = require('../../../../config/constants');
const { calculateItemCouponDiscount } = require('./cart_helpers');

const getCart = async (userId) => {
    const cart = await pool.query(
        'SELECT * FROM carts WHERE user_id = ? AND status = ?',
        [userId, CART_STATUS.ACTIVE]
    );

    if (!cart.length) {
        return { cart: null, cart_code: null, items: [] };
    }

    const lockMinutes = await settingsService.get(SETTING_KEYS.ITEM_LOCK_MINUTES);

    const items = await pool.query(`
    SELECT 
      ci.*,
      p.product_name,
      p.product_code,
      p.price_usd,
      p.price_try,
      p.price_syp,
      pc.color_name,
      pc.color_value,
      ps.size_value,
      TIMESTAMPDIFF(SECOND, ci.added_at, NOW()) as seconds_since_added
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    JOIN product_colors pc ON ci.color_id = pc.color_id
    JOIN product_sizes ps ON ci.size_id = ps.size_id
    WHERE ci.cart_id = ?
    ORDER BY ci.added_at DESC
  `, [cart[0].cart_id]);

    const lockSeconds = lockMinutes * 60;

    const itemIds = items.map(i => i.item_id);
    let beneficiariesMap = {};
    if (itemIds.length) {
        const beneficiariesMapRows = await pool.query(
            'SELECT item_id, beneficiary_name FROM cart_item_beneficiaries WHERE item_id IN (?)',
            [itemIds]
        );
        for (const r of beneficiariesMapRows) {
            if (!beneficiariesMap[r.item_id]) beneficiariesMap[r.item_id] = [];
            beneficiariesMap[r.item_id].push(r.beneficiary_name);
        }
    }

    const appliedCartCoupons = await pool.query(
        'SELECT cac.id, c.code FROM cart_applied_coupons cac JOIN coupons c ON cac.coupon_id = c.coupon_id WHERE cac.cart_id = ? AND cac.item_id IS NULL',
        [cart[0].cart_id]
    );

    const appliedItemCouponsRows = await pool.query(
        'SELECT cac.item_id, c.code, c.discount_type, c.discount_value, c.max_discount_amount, c.min_purchase_amount FROM cart_applied_coupons cac JOIN coupons c ON cac.coupon_id = c.coupon_id WHERE cac.cart_id = ? AND cac.item_id IS NOT NULL',
        [cart[0].cart_id]
    );

    const itemCouponsMap = {};
    for (const r of appliedItemCouponsRows) {
        if (!itemCouponsMap[r.item_id]) itemCouponsMap[r.item_id] = [];
        itemCouponsMap[r.item_id].push({
            code: r.code,
            discount_type: r.discount_type,
            discount_value: r.discount_value,
            max_discount_amount: r.max_discount_amount,
            min_purchase_amount: r.min_purchase_amount
        });
    }

    const userRows = await pool.query(
        'SELECT user_id, full_name, phone, email, customer_code, invoice_image FROM users WHERE user_id = ? LIMIT 1',
        [cart[0].user_id]
    );
    const customer = userRows.length ? userRows[0] : null;

    return {
        cart: {
            cart_id: cart[0].cart_id,
            cart_code: cart[0].cart_code,
            user_id: cart[0].user_id,
            status: cart[0].status,
            created_at: cart[0].created_at,
            updated_at: cart[0].updated_at,
            applied_coupons: appliedCartCoupons.map(r => r.code)
        },
        cart_code: cart[0].cart_code,
        customer,
        items: items.map(item => {
            const coupons = itemCouponsMap[item.item_id] || [];
            const priceUsd = parseFloat(item.price_usd);
            const priceTry = parseFloat(item.price_try);
            const priceSyp = parseFloat(item.price_syp);

            const detailedCoupons = coupons.map(c => {
                const discUsd = calculateItemCouponDiscount(priceUsd, c);
                const discTry = calculateItemCouponDiscount(priceTry, c);
                const discSyp = calculateItemCouponDiscount(priceSyp, c);

                const discountedUsd = Math.max(0, priceUsd - discUsd);
                const discountedTry = Math.max(0, priceTry - discTry);
                const discountedSyp = Math.max(0, priceSyp - discSyp);

                return {
                    code: c.code,
                    discount_type: c.discount_type,
                    discount_value: c.discount_value,
                    max_discount_amount: c.max_discount_amount,
                    min_purchase_amount: c.min_purchase_amount,
                    discount_amounts: {
                        usd: Number(discUsd.toFixed(2)),
                        try: Number(discTry.toFixed(2)),
                        syp: Number(discSyp.toFixed(2))
                    },
                    discounted_prices: {
                        usd: Number(discountedUsd.toFixed(2)),
                        try: Number(discountedTry.toFixed(2)),
                        syp: Number(discountedSyp.toFixed(2))
                    }
                };
            });

            return {
                item_id: item.item_id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_code: item.product_code,
                color_name: item.color_name,
                color_value: item.color_value,
                size_value: item.size_value,
                quantity: item.quantity,
                price_usd: item.price_usd,
                price_try: item.price_try,
                price_syp: item.price_syp,
                is_locked: item.is_locked === 1,
                added_at: item.added_at,
                lock_time_remaining: Math.max(0, lockSeconds - item.seconds_since_added),
                beneficiaries: beneficiariesMap[item.item_id] || [],
                customer_coupons: detailedCoupons
            };
        })
    };
};

const getUnlockedItems = async (userId) => {
    const orders = await pool.query(`
    SELECT 
      o.order_id,
      o.status,
      o.total_amount,
      o.discount_amount,
      o.payment_method,
      o.currency,
      o.shipping_address,
      o.created_at,
      i.invoice_number,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS items_count
    FROM orders o
    LEFT JOIN invoices i ON i.order_id = o.order_id
    WHERE o.user_id = ? AND o.status NOT IN (?, ?)
    ORDER BY o.created_at DESC
  `, [userId, ORDER_STATUS.CANCELLED, ORDER_STATUS.DELIVERED]);

    return { orders };
};

const getLockedItems = async (userId) => {
    const orders = await pool.query(`
    SELECT 
      o.order_id,
      o.status,
      o.total_amount,
      o.discount_amount,
      o.payment_method,
      o.currency,
      o.shipping_address,
      o.created_at,
      i.invoice_number,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) AS items_count
    FROM orders o
    LEFT JOIN invoices i ON i.order_id = o.order_id
    WHERE o.user_id = ? AND o.status = ?
    ORDER BY o.created_at DESC
  `, [userId, ORDER_STATUS.DELIVERED]);

    return { orders };
};

module.exports = {
    getCart,
    getUnlockedItems,
    getLockedItems
};
