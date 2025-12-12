/**
 * Seed Product Images
 * بذر بيانات صور المنتجات
 */

const seedProductImages = async (query) => {
    console.log('🖼️ Seeding product images...');

    await query(`
    INSERT IGNORE INTO product_images (product_id, image_url, is_main) VALUES
    (1, 'https://via.placeholder.com/400x600?text=Dress1', 1),
    (1, 'https://via.placeholder.com/400x600?text=Dress2', 0),
    (2, 'https://via.placeholder.com/400x600?text=Blouse', 1),
    (3, 'https://via.placeholder.com/400x600?text=Skirt', 1),
    (4, 'https://via.placeholder.com/400x600?text=Shirt', 1),
    (5, 'https://via.placeholder.com/400x600?text=Jeans', 1),
    (6, 'https://via.placeholder.com/400x600?text=Jacket', 1),
    (7, 'https://via.placeholder.com/400x600?text=KidsDress', 1),
    (8, 'https://via.placeholder.com/400x600?text=KidsSuit', 1),
    (9, 'https://via.placeholder.com/400x600?text=Bag', 1),
    (10, 'https://via.placeholder.com/400x600?text=Scarf', 1)
  `);

    console.log('✅ Product images seeded');
};

module.exports = { seedProductImages };
