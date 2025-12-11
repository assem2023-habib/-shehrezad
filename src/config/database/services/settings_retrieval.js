/**
 * Settings Retrieval Service
 * خدمة استرجاع الإعدادات
 */

const pool = require('../../dbconnect');
const { DEFAULT_SETTINGS } = require('../../constants');

let settingsCache = null;
let cacheExpiry = null;
const CACHE_DURATION = 5 * 60 * 1000;

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

const getSetting = async (key) => {
    if (!settingsCache || !cacheExpiry || Date.now() > cacheExpiry) {
        await loadAllSettings();
    }

    const value = settingsCache[key];
    if (value !== undefined) {
        return isNaN(value) ? value : Number(value);
    }

    return DEFAULT_SETTINGS[key] || null;
};

const getAllSettings = async () => {
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

const clearCache = () => {
    settingsCache = null;
    cacheExpiry = null;
};

module.exports = {
    getSetting,
    getAllSettings,
    loadAllSettings,
    clearCache
};
