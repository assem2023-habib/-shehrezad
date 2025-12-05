/**
 * Settings Controller - متحكم الإعدادات
 */

const settingsService = require('../../../../config/settings_service');
const response = require('../../../../config/response_helper');

/**
 * جلب جميع الإعدادات
 * GET /api/dashboard/settings
 */
const getAllSettings = async (req, res) => {
  try {
    const settings = await settingsService.getAll();
    return response.success(res, settings);

  } catch (error) {
    console.error('Get Settings Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب الإعدادات');
  }
};

/**
 * تحديث إعداد
 * PUT /api/dashboard/settings/:key
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return response.badRequest(res, 'يرجى تحديد القيمة الجديدة');
    }

    await settingsService.update(key, value, req.user.user_id);
    return response.updated(res, null, 'تم تحديث الإعداد بنجاح');

  } catch (error) {
    console.error('Update Setting Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء تحديث الإعداد');
  }
};

module.exports = {
  getAllSettings,
  updateSetting
};
