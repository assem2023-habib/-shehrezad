const settingsService = require('../../../config/settings_service');
const response = require('../../../config/response_helper');
const { SETTING_KEYS } = require('../../../config/constants');

const getSupportNumbers = async (req, res) => {
  try {
    const raw = await settingsService.get(SETTING_KEYS.SUPPORT_STAFF_NUMBERS);
    let numbers = [];
    try {
      numbers = JSON.parse(raw || '[]');
      if (!Array.isArray(numbers)) numbers = [];
    } catch (_) {
      numbers = [];
    }
    return response.success(res, { numbers });
  } catch (error) {
    console.error('Get Support Numbers Error:', error);
    return response.serverError(res, 'حدث خطأ أثناء جلب أرقام الدعم');
  }
};

module.exports = { getSupportNumbers };

