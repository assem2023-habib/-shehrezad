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

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartItem
};
