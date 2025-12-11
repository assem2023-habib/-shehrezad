/**
 * Settings Operations Service
 * خدمة العمليات على الإعدادات
 */

const pool = require('../../dbconnect');

const updateSetting = async (key, value, updatedBy = null) => {
    try {
        const result = await pool.query(
            'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
            [value.toString(), updatedBy, key]
        );

        if (!result.affectedRows) {
            await pool.query(
                'INSERT INTO settings (setting_key, setting_value, description, updated_by) VALUES (?, ?, NULL, ?)',
                [key, value.toString(), updatedBy]
            );
        }

        return true;
    } catch (error) {
        console.error('Error updating setting:', error);
        throw error;
    }
};

module.exports = {
    updateSetting
};
