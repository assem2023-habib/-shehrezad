/**
 * Settings Controller - متحكم الإعدادات
 */

const { settingsService } = require('../../../../config/database');
const response = require('../../../../config/response_helper');
const { SETTING_KEYS } = require('../../../../config/constants');

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
  updateSetting,
  updateInquiryNumbers: async (req, res) => {
    try {
      let { numbers } = req.body;
      if (!Array.isArray(numbers)) {
        return response.badRequest(res, 'يرجى إرسال قائمة الأرقام بشكل مصفوفة');
      }
      numbers = numbers.map(n => String(n).trim()).filter(n => n.length > 0);
      await settingsService.update(SETTING_KEYS.INQUIRY_STAFF_NUMBERS, JSON.stringify(numbers), req.user.user_id);
      return response.updated(res, { numbers }, 'تم تحديث أرقام موظفي الاستعلام');
    } catch (error) {
      console.error('Update Inquiry Numbers Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء تحديث الأرقام');
    }
  },
  updateSupportNumbers: async (req, res) => {
    try {
      let { numbers } = req.body;
      if (!Array.isArray(numbers)) {
        return response.badRequest(res, 'يرجى إرسال قائمة الأرقام بشكل مصفوفة');
      }
      numbers = numbers.map(n => String(n).trim()).filter(n => n.length > 0);
      await settingsService.update(SETTING_KEYS.SUPPORT_STAFF_NUMBERS, JSON.stringify(numbers), req.user.user_id);
      return response.updated(res, { numbers }, 'تم تحديث أرقام موظفي الدعم');
    } catch (error) {
      console.error('Update Support Numbers Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء تحديث الأرقام');
    }
  },
  updateBankAccount: async (req, res) => {
    try {
      const { bank_name, account_holder, iban, account_number, branch } = req.body;
      if (!bank_name || !iban) {
        return response.badRequest(res, 'يرجى إدخال اسم البنك و رقم الآيبان');
      }
      const data = {
        bank_name: String(bank_name).trim(),
        account_holder: account_holder ? String(account_holder).trim() : null,
        iban: String(iban).trim(),
        account_number: account_number ? String(account_number).trim() : null,
        branch: branch ? String(branch).trim() : null
      };
      await settingsService.update(SETTING_KEYS.BANK_ACCOUNT, JSON.stringify(data), req.user.user_id);
      return response.updated(res, data, 'تم تحديث بيانات الحساب البنكي');
    } catch (error) {
      console.error('Update Bank Account Error:', error);
      return response.serverError(res, 'حدث خطأ أثناء تحديث الحساب البنكي');
    }
  }
};
