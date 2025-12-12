/**
 * Seed Product Colors
 * بذر بيانات ألوان المنتجات
 */

const seedProductColors = async (query) => {
    console.log('🎨 Seeding product colors...');

    await query(`
    INSERT IGNORE INTO product_colors (product_id, color_name, color_value) VALUES
    (1, 'أسود', '#000000'),
    (1, 'أحمر', '#FF0000'),
    (2, 'أبيض', '#FFFFFF'),
    (2, 'أزرق فاتح', '#87CEEB'),
    (3, 'كحلي', '#000080'),
    (4, 'أبيض', '#FFFFFF'),
    (4, 'أزرق', '#0000FF'),
    (5, 'أزرق داكن', '#00008B'),
    (5, 'أسود', '#000000'),
    (6, 'بني', '#8B4513'),
    (7, 'وردي', '#FFC0CB'),
    (8, 'كحلي', '#000080'),
    (9, 'أسود', '#000000'),
    (9, 'بيج', '#F5F5DC'),
    (10, 'أحمر', '#FF0000'),
    (10, 'أخضر', '#008000')
  `);

    console.log('✅ Product colors seeded');
};

module.exports = { seedProductColors };
