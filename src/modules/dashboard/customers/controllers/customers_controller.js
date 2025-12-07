/**
 * Customers Controller - متحكم العملاء
 */

const customersService = require('../services/customers_service');
const response = require('../../../../config/response_helper');

const cloudinary = require('../../../../config/cloudinary');

const lastAddedCustomersController = async (req, res) => {
  try {
    const lastCustomers = await customersService.getLastAddedCustomers();
    return res.status(200).json({
      status: 200,
      success: true,
      customers: lastCustomers
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء جلب آخر العملاء المضافين"
    });
  }
};

/**
 * إضافة عميل جديد
 * POST /api/dashboard/customers
 */
const createCustomer = async (req, res) => {
  try {

    const { full_name, phone, email, password } = req.body || {};

    if (!full_name || !phone || !password) {
      return response.badRequest(res, 'يرجى إدخال الاسم ورقم الهاتف وكلمة المرور');
    }

    if (password.length < 6) {
      return response.badRequest(res, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }

    let invoice_image = null;

    if (req.file) {
      // رفع الصورة إلى Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `invoices/customers`,
            public_id: `invoice_${Date.now()}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      invoice_image = result.secure_url;
    }

    const customer = await customersService.createCustomer({
      full_name,
      phone,
      email,
      password,
      invoice_image
    });

    return response.created(res, customer, 'تم إضافة العميل بنجاح');

  } catch (error) {
    console.error('Create Customer Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء إضافة العميل');
  }
};

/**
 * تحديث بيانات عميل
 * PUT /api/dashboard/customers/:id
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email } = req.body;

    const customer = await customersService.updateCustomer(parseInt(id), {
      full_name,
      phone,
      email
    });

    return response.success(res, customer, 'تم تحديث بيانات العميل بنجاح');

  } catch (error) {
    console.error('Update Customer Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تحديث بيانات العميل');
  }
};

/**
 * حذف عميل
 * DELETE /api/dashboard/customers/:id
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await customersService.deleteCustomer(parseInt(id));

    return response.success(res, null, 'تم حذف العميل بنجاح');

  } catch (error) {
    console.error('Delete Customer Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء حذف العميل');
  }
};

/**
 * جلب جميع العملاء
 * GET /api/dashboard/customers?search=...
 */
const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const customers = await customersService.getAllCustomers(search);
    return response.success(res, customers);

  } catch (error) {
    console.error('Get Customers Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب العملاء');
  }
};

/**
 * جلب تفاصيل عميل
 * GET /api/dashboard/customers/:id
 */
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await customersService.getCustomerById(parseInt(id));

    if (!customer) {
      return response.notFound(res, 'العميل غير موجود');
    }

    return response.success(res, customer);

  } catch (error) {
    console.error('Get Customer Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب بيانات العميل');
  }
};

module.exports = {
  lastAddedCustomersController,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById
};
