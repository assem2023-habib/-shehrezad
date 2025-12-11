/**
 * Settings Service - Main Index
 * خدمة الإعدادات الرئيسية
 * تم تقسيم الخدمة إلى وحدات منفصلة لسهولة الصيانة
 */

const settingsRetrieval = require('./settings_retrieval');
const settingsOperations = require('./settings_operations');

module.exports = {
    get: settingsRetrieval.getSetting,
    getAll: settingsRetrieval.getAllSettings,
    update: settingsOperations.updateSetting,
    loadAllSettings: settingsRetrieval.loadAllSettings,
    clearCache: settingsRetrieval.clearCache
};
