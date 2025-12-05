/**
 * ثوابت التطبيق - Constants
 * ملف مركزي لجميع القيم الثابتة والـ ENUMs
 */

// أدوار المستخدمين
const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'employee',
  ACCOUNTANT: 'accountant',
  SUPER_ADMIN: 'super_admin'
};

// حالات السلة
const CART_STATUS = {
  ACTIVE: 'active',
  PENDING_SHIPMENT: 'pending_shipment',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// حالات الطلب
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// تصنيفات المنتجات
const PRODUCT_CATEGORIES = {
  WOMEN: 'women',
  MEN: 'men',
  KIDS: 'kids',
  ACCESSORIES: 'accessories',
  OFFERS: 'offers',
  NEW: 'new'
};

// حالة توفر المنتج
const AVAILABILITY_STATUS = {
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
};

// حالات التقييمات
const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// مفاتيح الإعدادات الافتراضية
const SETTING_KEYS = {
  ITEM_LOCK_MINUTES: 'item_lock_minutes',
  CART_REMINDER_DAYS: 'cart_reminder_days',
  MAX_CART_ITEMS: 'max_cart_items',
  MAX_IMAGES_PER_PRODUCT: 'max_images_per_product'
};

// القيم الافتراضية للإعدادات
const DEFAULT_SETTINGS = {
  [SETTING_KEYS.ITEM_LOCK_MINUTES]: 10,
  [SETTING_KEYS.CART_REMINDER_DAYS]: 15,
  [SETTING_KEYS.MAX_CART_ITEMS]: 50,
  [SETTING_KEYS.MAX_IMAGES_PER_PRODUCT]: 20
};

// رموز الاستجابة
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

module.exports = {
  USER_ROLES,
  CART_STATUS,
  ORDER_STATUS,
  PRODUCT_CATEGORIES,
  AVAILABILITY_STATUS,
  REVIEW_STATUS,
  SETTING_KEYS,
  DEFAULT_SETTINGS,
  HTTP_STATUS
};
