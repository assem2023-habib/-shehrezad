/**
 * Profile Controller - التحكم بالملف الشخصي
 */

const profileService = require('../services/profile_service');
const response = require('../../../../config/response_helper');
const cloudinary = require('../../../../config/cloudinary');

/**
 * عرض الملف الشخصي
 * GET /api/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const profile = await profileService.getProfile(userId);
    return response.success(res, profile);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء جلب الملف الشخصي');
  }
};

/**
 * تحديث الملف الشخصي
 * PUT /api/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const updatedProfile = await profileService.updateProfile(userId, req.body);
    return response.updated(res, updatedProfile, 'تم تحديث الملف الشخصي بنجاح');
  } catch (error) {
    console.error('Update Profile Error:', error);
    return response.handleError(res, error, 'حدث خطأ أثناء تحديث الملف الشخصي');
  }
};

/**
 * رفع صورة الفاتورة
 * POST /api/profile/invoice-image
 */
const uploadInvoiceImage = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!req.file) {
      return response.badRequest(res, 'يرجى إرفاق صورة');
    }

    // رفع الصورة إلى Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `invoices/${userId}`,
          public_id: `invoice_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // حفظ الرابط في قاعدة البيانات
    await profileService.updateInvoiceImage(userId, result.secure_url);

    return response.success(res, {
      invoice_image: result.secure_url
    }, 'تم رفع صورة الفاتورة بنجاح');

  } catch (error) {
    console.error('Upload Invoice Image Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء رفع الصورة');
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadInvoiceImage
};
