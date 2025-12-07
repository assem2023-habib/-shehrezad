const pool = require("../../../../config/dbconnect");
const cloudinary = require("../../../../config/cloudinary");

const deleteProductImages = async (req, res) => {
    try {
        const { product_id } = req.body;
        let { remove_images } = req.body;

        // ===== 1) التحقق من المدخلات الأساسية =====
        if (!product_id)
            return res.status(400).json({ success: false, message: "يرجى إرسال رقم المنتج product_id" });

        if (!remove_images)
            return res.status(400).json({ success: false, message: "يرجى إرسال الصور للحذف remove_images" });

        // تحويل remove_images إلى Array
        let removeArr = [];

        if (Array.isArray(remove_images)) {
            removeArr = remove_images;
        } else if (typeof remove_images === "string") {
            try {
                removeArr = JSON.parse(remove_images);
            } catch {
                return res.status(400).json({ success: false, message: "تنسيق remove_images غير صالح" });
            }
        } else {
            return res.status(400).json({ success: false, message: "remove_images يجب أن يكون Array" });
        }


        if (!Array.isArray(remove_images) || remove_images.length === 0)
            return res.status(400).json({ success: false, message: "remove_images يجب أن يحتوي على صور" });

        // ===== 2) التحقق من وجود المنتج =====
        const productExists = await pool.query(
            "SELECT product_id FROM products WHERE product_id = ?",
            [product_id]
        );

        if (!productExists.length) {
            return res.status(404).json({
                success: false,
                message: "المنتج غير موجود ولا يمكن حذف الصور"
            });
        }

        // ===== 3) جلب الصور الموجودة للمنتج =====
        const existingImages = await pool.query(
            "SELECT public_id FROM product_images WHERE product_id = ?",
            [product_id]
        );

        const existingPublicIds = existingImages.map(img => img.public_id);

        // ===== 4) التأكد أن الصور المطلوب حذفها تخص نفس المنتج =====
        const invalidImages = remove_images.filter(pubId => !existingPublicIds.includes(pubId));

        if (invalidImages.length > 0) {
            return res.status(400).json({
                success: false,
                message: "لا يمكن حذف صور غير موجودة أو لا تخص هذا المنتج",
                invalid_images: invalidImages
            });
        }

        // ===== 5) حذف الصور من Cloudinary =====
        await Promise.all(
            remove_images.map(async (pubId) => {
                try {
                    await cloudinary.uploader.destroy(pubId);
                } catch (e) {
                    console.warn("Cloudinary delete error:", e.message);
                }
            })
        );

        // ===== 6) حذف الصور من قاعدة البيانات =====
        await pool.query(
            "DELETE FROM product_images WHERE public_id IN (?) AND product_id = ?",
            [remove_images, product_id]
        );

        return res.status(200).json({
            success: true,
            product_id,
            deleted_images: remove_images,
            message: "تم حذف الصور بنجاح"
        });

    } catch (error) {
        console.error("Delete Product Images Error:", error);
        return res.status(500).json({
            success: false,
            message: "حدث خطأ أثناء حذف الصور",
            error: error.message
        });
    }
};

module.exports = { deleteProductImages };


// التجريب بالبوستمان بهالشكل
// {
//   "product_id":1,
//   "remove_images":"[\"products/1/prod_1_1764707407148\",\"products/1/prod_1_1764707409131\"]"
 
// }
