// التحقق من مدخلات المنتج
const allowedCategories = ['women', 'men', 'kids', 'accessories', 'offers', 'new'];

/**
 * Middleware للتحقق من بيانات المنتج عند الإضافة
 * product_code يتم توليده تلقائياً لذا لا نتحقق منه
 * يدعم البيانات من JSON أو form-data
 */
const validateProduct = async (req, res, next) => {
  // التأكد من وجود req.body
  if (!req.body) {
    req.body = {};
  }

  const { product_name, product_category, price_usd, price_try, price_syp } = req.body;

  // التحقق من الحقول الأساسية (بدون product_code - يتم توليده تلقائياً)
  if (!product_name || !product_category) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "الرجاء إدخال product_name و product_category"
    });
  }

  // التحقق من التصنيف
  if (!allowedCategories.includes(product_category)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: `القيمة غير صالحة للتصنيف، يجب أن تكون واحدة من: ${allowedCategories.join(', ')}`
    });
  }

  // التحقق من السعر - يجب إدخال سعر واحد على الأقل
  // تحويل القيم إلى أرقام للمقارنة (في حالة formdata تكون strings)
  const priceUsd = parseFloat(price_usd) || 0;
  const priceTry = parseFloat(price_try) || 0;
  const priceSyp = parseFloat(price_syp) || 0;

  if (priceUsd === 0 && priceTry === 0 && priceSyp === 0) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يجب إدخال سعر واحد على الأقل لإحدى العملات: USD، TRY، SYP"
    });
  }

  // لو كل شيء تمام، ننتقل للكونترولر
  next();
};

/**
 * Middleware للتحقق من بيانات المنتج عند التحديث
 * يسمح بتمرير product_code للتحديث
 * يدعم البيانات من JSON أو form-data
 */
const validateProductUpdate = async (req, res, next) => {
  // التأكد من وجود req.body
  if (!req.body) {
    req.body = {};
  }

  const { product_code, product_name, product_category, price_usd, price_try, price_syp } = req.body;

  // التحقق من الحقول الأساسية - للتحديث يمكن أن تكون اختيارية
  // يجب إدخال قيمة واحدة على الأقل
  if (!product_code && !product_name && !product_category && !price_usd && !price_try && !price_syp) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: "يجب إدخال قيمة واحدة على الأقل للتحديث"
    });
  }

  // التحقق من التصنيف - فقط إذا تم إرساله
  if (product_category && !allowedCategories.includes(product_category)) {
    return res.status(400).json({
      status: 400,
      success: false,
      message: `القيمة غير صالحة للتصنيف، يجب أن تكون واحدة من: ${allowedCategories.join(', ')}`
    });
  }

  // التحقق من السعر - فقط إذا تم إرسال أسعار
  if (price_usd || price_try || price_syp) {
    const priceUsd = parseFloat(price_usd) || 0;
    const priceTry = parseFloat(price_try) || 0;
    const priceSyp = parseFloat(price_syp) || 0;

    if (priceUsd === 0 && priceTry === 0 && priceSyp === 0) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: "يجب إدخال سعر واحد على الأقل لإحدى العملات: USD، TRY، SYP"
      });
    }
  }

  next();
};

module.exports = { validateProduct, validateProductUpdate };
