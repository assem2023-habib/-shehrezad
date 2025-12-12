/**
 * Seed Product Sizes
 * بذر بيانات مقاسات المنتجات
 */

const seedProductSizes = async (query) => {
    console.log('📏 Seeding product sizes...');

    const colors = await query('SELECT color_id, product_id FROM product_colors');

    for (const color of colors) {
        const sizes = ['S', 'M', 'L', 'XL'];
        for (const size of sizes) {
            const quantity = Math.floor(Math.random() * 20) + 5;
            await query(
                'INSERT IGNORE INTO product_sizes (color_id, size_value, quantity) VALUES (?, ?, ?)',
                [color.color_id, size, quantity]
            );
        }
    }

    console.log('✅ Product sizes seeded');
};

module.exports = { seedProductSizes };
