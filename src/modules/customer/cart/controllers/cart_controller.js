/**
 * Cart Controller - متحكم السلة
 */

const cartService = require('../services/cart_service');
const response = require('../../../../config/response_helper');

/**
 * إضافة منتج للسلة
 * POST /api/cart/add
 */
const addToCart = async (req, res) => {
  try {
    const { product_id, color_id, size_id, quantity } = req.body;

    if (!product_id || !color_id || !size_id) {
      return response.badRequest(res, 'يرجى تحديد المنتج واللون والمقاس');
    }

    const item = await cartService.addItem(req.user.user_id, {
      product_id,
      color_id,
      size_id,
      quantity: quantity || 1
    });

    return response.success(res, item, 'تمت إضافة المنتج للسلة');

  } catch (error) {
    console.error('Add to Cart Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء إضافة المنتج');
  }
};

/**
 * عرض السلة
 * GET /api/cart
 */
const getCart = async (req, res) => {
  try {
    const result = await cartService.getCart(req.user.user_id);
    return response.success(res, result);

  } catch (error) {
    console.error('Get Cart Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب السلة');
  }
};

/**
 * حذف عنصر من السلة
 * DELETE /api/cart/remove/:item_id
 */
const removeFromCart = async (req, res) => {
  try {
    const { item_id } = req.params;
    await cartService.removeItem(req.user.user_id, parseInt(item_id));
    return response.deleted(res, 'تم حذف العنصر من السلة');

  } catch (error) {
    console.error('Remove from Cart Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء حذف العنصر');
  }
};

/**
 * تحديث كمية عنصر
 * PUT /api/cart/update/:item_id
 */
const updateCartItem = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return response.badRequest(res, 'يرجى تحديد الكمية');
    }

    const result = await cartService.updateItem(
      req.user.user_id,
      parseInt(item_id),
      parseInt(quantity)
    );

    return response.updated(res, result, 'تم تحديث الكمية');

  } catch (error) {
    console.error('Update Cart Item Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تحديث العنصر');
  }
};

/**
 * مسح السلة (العناصر غير المحجوزة فقط)
 * DELETE /api/cart/clear
 */
const clearCart = async (req, res) => {
  try {
    const result = await cartService.clearCart(req.user.user_id);
    return response.deleted(res, 'تم مسح العناصر غير المحجوزة من السلة');
  } catch (error) {
    console.error('Clear Cart Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء مسح السلة');
  }
};

/**
 * تعيين/تعديل أسماء المستفيدين لعنصر سلة
 * PUT /api/cart/beneficiaries/:item_id
 */
const setItemBeneficiaries = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { beneficiaries = [] } = req.body;
    const id = parseInt(item_id);
    if (Number.isNaN(id)) {
      return response.badRequest(res, 'معرف العنصر غير صالح');
    }
    const result = await cartService.setItemBeneficiaries(req.user.user_id, id, beneficiaries);
    return response.success(res, result, 'تم تحديث أسماء المستفيدين');
  } catch (error) {
    console.error('Set Beneficiaries Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تحديث أسماء المستفيدين');
  }
};

const getUnlockedCartItems = async (req, res) => {
  try {
    const result = await cartService.getUnlockedItems(req.user.user_id);
    return response.success(res, result);
  } catch (error) {
    console.error('Get Unlocked Cart Items Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب عناصر السلة غير المحجوزة');
  }
};

const getLockedCartItems = async (req, res) => {
  try {
    const result = await cartService.getLockedItems(req.user.user_id);
    return response.success(res, result);
  } catch (error) {
    console.error('Get Locked Cart Items Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب عناصر السلة المحجوزة');
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem
  ,
  clearCart,
  setItemBeneficiaries
  ,
  getUnlockedCartItems,
  getLockedCartItems,
  getCartItem: async (req, res) => {
    try {
      const { item_id } = req.params;
      const item = await cartService.getItemDetails(parseInt(item_id));
      if (!item) {
        return response.notFound(res, 'العنصر غير موجود');
      }
      return response.success(res, item);
    } catch (error) {
      console.error('Get Cart Item Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء جلب عنصر السلة');
    }
  },
  applyCoupon: async (req, res) => {
    try {
      const { code, item_id } = req.body;
      if (!code) {
        return response.badRequest(res, 'يرجى إدخال رمز الكوبون');
      }
      const result = await cartService.applyCoupon(req.user.user_id, code, item_id ? parseInt(item_id) : null);
      return response.created(res, result, 'تم تطبيق الكوبون');
    } catch (error) {
      console.error('Apply Coupon Error:', error);
      return response.handleError(res, error, 'فشل تطبيق الكوبون');
    }
  },
  getAppliedCoupons: async (req, res) => {
    try {
      const result = await cartService.getAppliedCoupons(req.user.user_id);
      return response.success(res, result);
    } catch (error) {
      console.error('Get Applied Coupons Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء جلب الكوبونات المطبقة');
    }
  }
};
