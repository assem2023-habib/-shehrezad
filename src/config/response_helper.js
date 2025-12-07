/**
 * Response Helper - مساعد الاستجابات الموحد
 * ملف مركزي لتوحيد شكل جميع الاستجابات في التطبيق
 */

const { HTTP_STATUS } = require('./constants');

/**
 * مفاتيح الاستجابة الافتراضية
 * يمكنك تعديلها من هنا لتغيير شكل الاستجابة في كل التطبيق
 */
const RESPONSE_KEYS = {
  STATUS: 'status',
  SUCCESS: 'success',
  MESSAGE: 'message',
  DATA: 'data',
  COUNT: 'count',
  ERROR: 'error'
};

/**
 * رسائل افتراضية
 */
const DEFAULT_MESSAGES = {
  SUCCESS: 'تمت العملية بنجاح',
  CREATED: 'تم الإنشاء بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  NOT_FOUND: 'العنصر غير موجود',
  BAD_REQUEST: 'بيانات غير صالحة',
  UNAUTHORIZED: 'غير مصرح',
  FORBIDDEN: 'ممنوع الوصول',
  SERVER_ERROR: 'حدث خطأ في الخادم'
};

/**
 * بناء كائن الاستجابة
 * @private
 */
const buildResponse = (status, success, message, data = null, extra = {}) => {
  const response = {
    [RESPONSE_KEYS.STATUS]: status,
    [RESPONSE_KEYS.SUCCESS]: success,
    [RESPONSE_KEYS.MESSAGE]: message
  };

  if (data !== null) {
    // إذا كان مصفوفة، أضف العدد
    if (Array.isArray(data)) {
      response[RESPONSE_KEYS.COUNT] = data.length;
    }
    response[RESPONSE_KEYS.DATA] = data;
  }

  // إضافة أي حقول إضافية
  Object.assign(response, extra);

  return response;
};

// =====================
// Success Responses
// =====================

/**
 * استجابة نجاح عامة
 */
const success = (res, data = null, message = DEFAULT_MESSAGES.SUCCESS, status = HTTP_STATUS.OK) => {
  return res.status(status).json(buildResponse(status, true, message, data));
};

/**
 * استجابة إنشاء ناجح
 */
const created = (res, data = null, message = DEFAULT_MESSAGES.CREATED) => {
  return res.status(HTTP_STATUS.CREATED).json(
    buildResponse(HTTP_STATUS.CREATED, true, message, data)
  );
};

/**
 * استجابة تحديث ناجح
 */
const updated = (res, data = null, message = DEFAULT_MESSAGES.UPDATED) => {
  return res.status(HTTP_STATUS.OK).json(
    buildResponse(HTTP_STATUS.OK, true, message, data)
  );
};

/**
 * استجابة حذف ناجح
 */
const deleted = (res, message = DEFAULT_MESSAGES.DELETED) => {
  return res.status(HTTP_STATUS.OK).json(
    buildResponse(HTTP_STATUS.OK, true, message)
  );
};

// =====================
// Error Responses
// =====================

/**
 * استجابة خطأ عامة
 */
const error = (res, message, status = HTTP_STATUS.SERVER_ERROR, errorDetails = null) => {
  const response = buildResponse(status, false, message);
  if (errorDetails) {
    response[RESPONSE_KEYS.ERROR] = errorDetails;
  }
  return res.status(status).json(response);
};

/**
 * خطأ في المدخلات
 */
const badRequest = (res, message = DEFAULT_MESSAGES.BAD_REQUEST) => {
  return error(res, message, HTTP_STATUS.BAD_REQUEST);
};

/**
 * غير مصرح
 */
const unauthorized = (res, message = DEFAULT_MESSAGES.UNAUTHORIZED) => {
  return error(res, message, HTTP_STATUS.UNAUTHORIZED);
};

/**
 * ممنوع الوصول
 */
const forbidden = (res, message = DEFAULT_MESSAGES.FORBIDDEN) => {
  return error(res, message, HTTP_STATUS.FORBIDDEN);
};

/**
 * غير موجود
 */
const notFound = (res, message = DEFAULT_MESSAGES.NOT_FOUND) => {
  return error(res, message, HTTP_STATUS.NOT_FOUND);
};

/**
 * خطأ في الخادم
 */
const serverError = (res, message = DEFAULT_MESSAGES.SERVER_ERROR, errorDetails = null) => {
  return error(res, message, HTTP_STATUS.SERVER_ERROR, errorDetails);
};

/**
 * معالجة الخطأ من catch block
 * يتعامل مع الأخطاء المخصصة التي لها status
 */
const handleError = (res, err, defaultMessage = DEFAULT_MESSAGES.SERVER_ERROR) => {
  const status = err.status || HTTP_STATUS.SERVER_ERROR;
  const message = err.message || defaultMessage;
  return error(res, message, status);
};

module.exports = {
  // Success responses
  success,
  created,
  updated,
  deleted,
  
  // Error responses
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  handleError,
  
  // Constants for customization
  RESPONSE_KEYS,
  DEFAULT_MESSAGES
};
