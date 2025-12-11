// env variables are loaded in server.js

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// زيادة timeout للطلبات الطويلة
app.use((req, res, next) => {
  req.setTimeout(20 * 60 * 1000);
  res.setTimeout(20 * 60 * 1000);
  next();
});


// =====================
// Auth Routes
// =====================
app.use('/auth', require('./modules/auth/routes/login_route'));
app.use('/auth', require('./modules/auth/routes/logout_route'));
app.use('/auth', require('./modules/auth/routes/customer_login_route'));
app.use('/auth', require('./modules/auth/routes/admin_setup_route'));
app.use('/auth', require('./modules/auth/routes/super_admin_login_route'));


// =====================
// Customer Routes (العميل)
// =====================
// المنتجات - عام
app.use('/api/products', require('./modules/customer/products/routes/products_routes'));

// السلة - يتطلب توكن
app.use('/api/cart', require('./modules/customer/cart/routes/cart_routes'));


// التقييمات - يتطلب توكن
app.use('/api/reviews', require('./modules/customer/reviews/routes/reviews_routes'));

// المفضلة - يتطلب توكن
app.use('/api/favorites', require('./modules/customer/favorites/routes/favorites_routes'));


// =====================
// Dashboard Routes (لوحة التحكم)
// =====================
// معلومات المستخدم
app.use('/api', require('./modules/auth/routes/get_userinfo_route'));

// الصور
app.use('/images', require('./modules/dashboard/images/routes/images_route'));

// المنتجات (إضافة/تعديل/حذف/عرض)
app.use('/api', require('./modules/dashboard/product/routes/add_product_route'));
app.use('/api', require('./modules/dashboard/product/routes/update_product_route'));
app.use('/api', require('./modules/dashboard/product/routes/delete_product_route'));
app.use('/api/dashboard', require('./modules/dashboard/product/routes/get_products_route'));
app.use('/api/dashboard/products', require('./modules/dashboard/product/routes/get_product_by_id_route'));

// السلات
app.use('/api/dashboard/carts', require('./modules/dashboard/carts/routes/dashboard_carts_routes'));

// العملاء
app.use('/api/dashboard/customers', require('./modules/dashboard/customers/routes/customers_routes'));

// الطلبات والفواتير
app.use('/api/dashboard/orders', require('./modules/dashboard/orders/routes/dashboard_orders_routes'));

// الأدمنز (super_admin فقط)
app.use('/api/dashboard/admins', require('./modules/dashboard/admins/routes/admins_routes'));

// الإعدادات
app.use('/api/dashboard/settings', require('./modules/dashboard/settings/routes/settings_routes'));

// التقييمات
app.use('/api/dashboard/reviews', require('./modules/dashboard/reviews/routes/dashboard_reviews_routes'));

// الديون
app.use('/api/dashboard/debts', require('./modules/dashboard/debts/routes/debts_routes'));

// الكوبونات
app.use('/api/dashboard/coupons', require('./modules/dashboard/coupons/routes/coupon_routes'));


// =====================
// Shared Routes / Other
// =====================
// الكوبونات (العميل)
app.use('/api/coupons', require('./modules/customer/coupons/routes/customer_coupon_routes'));

// الملف الشخصي (العميل)
app.use('/api/profile', require('./modules/customer/profile/routes/profile_routes'));

// الدعم (عام)
app.use('/api/support', require('./modules/customer/support/routes/support_routes'));


// =====================
// 404 Handler
// =====================
app.use((req, res) => {
  res.status(404).json({ message: '404 not found' });
});


module.exports = app;
