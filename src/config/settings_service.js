/**
 * خدمة الإعدادات - Settings Service
 * للحصول على الإعدادات الديناميكية من قاعدة البيانات
 */

const pool = require('./dbconnect');
const { DEFAULT_SETTINGS } = require('./constants');

// كاش للإعدادات لتقليل الاستعلامات
let settingsCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

/**
 * تحميل جميع الإعدادات من قاعدة البيانات
 */
const loadAllSettings = async () => {
  try {
    const rows = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    settingsCache = settings;
    cacheExpiry = Date.now() + CACHE_DURATION;
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * الحصول على قيمة إعداد محدد
 * @param {string} key - مفتاح الإعداد
 * @returns {Promise<string|number>} قيمة الإعداد
 */
const get = async (key) => {
  // التحقق من صلاحية الكاش
  if (!settingsCache || !cacheExpiry || Date.now() > cacheExpiry) {
    await loadAllSettings();
  }

  const value = settingsCache[key];
  if (value !== undefined) {
    // تحويل للرقم إذا كان رقماً
    return isNaN(value) ? value : Number(value);
  }

  // إرجاع القيمة الافتراضية
  return DEFAULT_SETTINGS[key] || null;
};

/**
 * تحديث إعداد
 * @param {string} key - مفتاح الإعداد
 * @param {string|number} value - القيمة الجديدة
 * @param {number} updatedBy - معرف المستخدم
 */
const update = async (key, value, updatedBy = null) => {
  try {
    await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [value.toString(), updatedBy, key]
    );
    // مسح الكاش لإعادة التحميل
    settingsCache = null;
    cacheExpiry = null;
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    throw error;
  }
};

/**
 * الحصول على جميع الإعدادات مع الوصف
 */
const getAll = async () => {
  try {
    const rows = await pool.query(
      'SELECT setting_key, setting_value, description, updated_at FROM settings ORDER BY setting_id'
    );
    return rows;
  } catch (error) {
    console.error('Error getting all settings:', error);
    throw error;
  }
};

/**
 * مسح الكاش
 */
const clearCache = () => {
  settingsCache = null;
  cacheExpiry = null;
};

module.exports = {
  get,
  update,
  getAll,
  clearCache,
  loadAllSettings
};
