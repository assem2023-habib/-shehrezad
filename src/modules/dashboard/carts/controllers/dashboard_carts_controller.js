/**
 * Dashboard Carts Controller - متحكم السلات للوحة التحكم
 */

const dashboardCartsService = require('../services/dashboard_carts_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع السلات الفعالة
 * GET /api/dashboard/carts
 */
const getAllCarts = async (req, res) => {
  try {
    const carts = await dashboardCartsService.getAllCarts();
    return response.success(res, carts);

  } catch (error) {
    console.error('Get All Carts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب السلات');
  }
};

/**
 * العرض الفوري - جميع العناصر المضافة
 * GET /api/dashboard/cart-items
 */
const getAllCartItems = async (req, res) => {
  try {
    const items = await dashboardCartsService.getAllCartItems();
    return response.success(res, items);

  } catch (error) {
    console.error('Get Cart Items Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب العناصر');
  }
};

/**
 * السلات الجاهزة للشحن (تجاوزت المدة)
 * GET /api/dashboard/carts/pending
 */
const getPendingCarts = async (req, res) => {
  try {
    const carts = await dashboardCartsService.getPendingCarts();
    return response.success(res, carts);

  } catch (error) {
    console.error('Get Pending Carts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب السلات');
  }
};

/**
 * تفاصيل سلة محددة
 * GET /api/dashboard/cart/:cart_id
 */
const getCartDetails = async (req, res) => {
  try {
    const { cart_id } = req.params;
    const result = await dashboardCartsService.getCartDetails(parseInt(cart_id));

    if (!result) {
      return response.notFound(res, 'السلة غير موجودة');
    }

    return response.success(res, result);

  } catch (error) {
    console.error('Get Cart Details Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب تفاصيل السلة');
  }
};

/**
 * تأكيد السلة بالكود وإنشاء طلب مع حساب الديون
 * POST /api/dashboard/carts/confirm
 * Body: { cart_code: 'CART-20241205-00001', paid_amount: 3000 }
 */
const confirmCartByCode = async (req, res) => {
  try {
    const { cart_code, paid_amount, shipping_address, payment_method, currency, customer_note, cart_note, grand_total } = req.body;
    const employeeId = req.user.user_id;

    if (!cart_code) {
      return response.badRequest(res, 'يرجى إدخال كود السلة');
    }

    const result = await dashboardCartsService.confirmCartByCode(
      cart_code,
      employeeId,
      paid_amount || 0,
      shipping_address,
      payment_method,
      currency || 'TRY',
      customer_note || null,
      cart_note || null,
      grand_total !== undefined ? grand_total : null
    );
    return response.created(res, result, 'تم تأكيد السلة وإنشاء الطلب بنجاح');

  } catch (error) {
    console.error('Confirm Cart Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تأكيد السلة');
  }
};

/**
 * إنشاء سلة جديدة (مدير)
 * POST /api/dashboard/carts
 */
const createCart = async (req, res) => {
  try {
    const { user_id, status = 'active', items = [] } = req.body;

    if (!user_id) {
      return response.badRequest(res, 'يرجى إدخال معرف المستخدم');
    }

    const result = await dashboardCartsService.createCartAdmin(parseInt(user_id), status, items);
    return response.created(res, result, 'تم إنشاء السلة بنجاح');

  } catch (error) {
    console.error('Create Cart Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء إنشاء السلة');
  }
};

/**
 * تحديث سلة (مدير)
 * PUT /api/dashboard/carts/:cart_id
 */
const updateCart = async (req, res) => {
  try {
    const { cart_id } = req.params;
    const payload = req.body || {};

    const id = parseInt(cart_id);
    if (Number.isNaN(id)) {
      return response.badRequest(res, 'معرف السلة غير صالح');
    }

    const exists = await dashboardCartsService.getCartDetails(id);
    if (!exists) {
      return response.notFound(res, 'السلة غير موجودة');
    }

    const result = await dashboardCartsService.updateCartAdmin(id, payload);
    return response.success(res, result);

  } catch (error) {
    console.error('Update Cart Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء تحديث السلة');
  }
};

/**
 * حذف سلة (مدير)
 * DELETE /api/dashboard/carts/:cart_id
 */
const deleteCart = async (req, res) => {
  try {
    const { cart_id } = req.params;
    const id = parseInt(cart_id);
    if (Number.isNaN(id)) {
      return response.badRequest(res, 'معرف السلة غير صالح');
    }

    const exists = await dashboardCartsService.getCartDetails(id);
    if (!exists) {
      return response.notFound(res, 'السلة غير موجودة');
    }

    await dashboardCartsService.deleteCartAdmin(id);
    return response.deleted(res, 'تم حذف السلة بنجاح');

  } catch (error) {
    console.error('Delete Cart Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء حذف السلة');
  }
};
const searchCarts = async (req, res) => {
  try {
    const { cart_id, cart_code } = req.query;
    const result = await dashboardCartsService.searchCarts({ cart_id, cart_code });
    return response.success(res, result);
  } catch (error) {
    console.error('Search Carts Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء البحث عن السلات');
  }
};

const searchCartItems = async (req, res) => {
  try {
    const { cart_id } = req.params;
    const { item_id, product_code } = req.query;
    const result = await dashboardCartsService.searchCartItems(parseInt(cart_id), { item_id, product_code });
    return response.success(res, result);
  } catch (error) {
    console.error('Search Cart Items Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء البحث عن عناصر السلة');
  }
};


module.exports = {
  getAllCarts,
  getAllCartItems,
  getPendingCarts,
  getCartDetails,
  confirmCartByCode,
  createCart,
  updateCart,
  deleteCart,
  searchCarts,
  searchCartItems
};
