/**
 * خدمة السلة - Cart Service
 * المنطق الأساسي للتعامل مع السلة
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const cartOperations = require('./cart_operations');
const cartRetrieval = require('./cart_retrieval');
const cartCoupons = require('./cart_coupons');
const { getItemDetails } = require('./cart_helpers');

module.exports = {
  getOrCreateCart: cartOperations.getOrCreateCart,
  addItem: cartOperations.addItem,
  removeItem: cartOperations.removeItem,
  updateItem: cartOperations.updateItem,
  clearCart: cartOperations.clearCart,
  getCart: cartRetrieval.getCart,
  getUnlockedItems: cartRetrieval.getUnlockedItems,
  getLockedItems: cartRetrieval.getLockedItems,
  getItemDetails,
  applyCoupon: cartCoupons.applyCoupon,
  getAppliedCoupons: cartCoupons.getAppliedCoupons,
  setItemBeneficiaries: cartCoupons.setItemBeneficiaries
};
