const pool = require("../../../../config/dbconnect");
const cloudinary = require("../../../../config/cloudinary");

const addProductImages = async (req, res) => {
  try {
    const product_id = req.body.product_id;
    if (!product_id) return res.status(400).json({ status: 400, success: false, message: "يرجى تحديد المنتج" });

    const productCheck = await pool.query("SELECT product_id FROM products WHERE product_id = ?", [product_id]);
    if (!productCheck.length) return res.status(401).json({ status:401,success: false, message: "المنتج غير موجود" });

    const newFiles = req.files || [];
    const existingImages = await pool.query("SELECT image_id FROM product_images WHERE product_id = ?", [product_id]);

    if (existingImages.length + newFiles.length > 20)
      return res.status(404).json({
        status:404,
        success: false,
        message: `الحد الأقصى للصور هو 20. العدد الحالي بعد التحديث سيكون ${existingImages.length + newFiles.length}`
      });

    const uploadedImages = [];

    for (const file of newFiles) {
      const base64 = `data:image/jpeg;base64,${file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: `products/${product_id}`,
        public_id: `prod_${product_id}_${Date.now()}`,
        unique_filename: true,
      });

      await pool.query(
        "INSERT INTO product_images (product_id, image_url, public_id) VALUES (?, ?, ?)",
        [product_id, uploadResult.secure_url, uploadResult.public_id]
      );

      uploadedImages.push({ image_url: uploadResult.secure_url, public_id: uploadResult.public_id });
    }

    return res.status(200).json({
      status: 200,
      success: true,
      product_id,
      message: "تم رفع الصور بنجاح",
      images: uploadedImages
    });

  } catch (error) {
    console.error("Add Product Images Error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء رفع الصور",
      error: error.message
    });
  }
};

module.exports = { addProductImages };
