const pool = require("../../../../config/dbconnect");
const cloudinary = require("../../../../config/cloudinary");

/**
 * رفع صورة واحدة إلى Cloudinary
 */
const uploadImageToCloudinary = async (file, productId) => {
    const base64 = `data:image/jpeg;base64,${file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(base64, {
        folder: `products/${productId}`,
        public_id: `prod_${productId}_${Date.now()}`,
        unique_filename: true,
    });
    return uploadResult;
};

const updateProduct = async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnectionAsync();
        await connection.queryAsync("START TRANSACTION");

        const { product_id } = req.params;
        let {
            product_code,
            product_name,
            product_description,
            product_category,
            price_usd,
            price_try,
            price_syp,
            colors // الألوان الجديدة أو المعدلة
        } = req.body;

        // Parse colors if it's a string (from form-data)
        if (typeof colors === 'string') {
            try {
                colors = JSON.parse(colors);
            } catch (e) {
                colors = [];
            }
        }

        // التأكد أن المنتج موجود
        const productCheck = await connection.queryAsync(
            "SELECT * FROM products WHERE product_id = ?",
            [product_id]
        );
        if (!productCheck.length) {
            return res.status(401).json({
                status: 401,
                success: false,
                message: "المنتج غير موجود"
            });
        }

        // التحقق من أن الكود الجديد غير مكرر
        if (product_code) {
            const codeCheck = await connection.queryAsync(
                "SELECT product_id FROM products WHERE product_code = ? AND product_id != ?",
                [product_code, product_id]
            );

            if (codeCheck.length) {
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: "الكود مستخدم مسبقاً لمنتج آخر"
                });
            }
        }

        // تحديث بيانات المنتج الأساسية - فقط الحقول المرسلة
        const currentProduct = productCheck[0];

        // بناء UPDATE query ديناميكي بناءً على الحقول المرسلة
        let updateFields = [];
        let updateValues = [];

        if (product_code !== undefined) {
            updateFields.push("product_code=?");
            updateValues.push(product_code);
        }
        if (product_name !== undefined) {
            updateFields.push("product_name=?");
            updateValues.push(product_name);
        }
        if (product_description !== undefined) {
            updateFields.push("product_description=?");
            updateValues.push(product_description || "");
        }
        if (product_category !== undefined) {
            updateFields.push("product_category=?");
            updateValues.push(product_category);
        }
        if (price_usd !== undefined) {
            updateFields.push("price_usd=?");
            updateValues.push(price_usd || 0);
        }
        if (price_try !== undefined) {
            updateFields.push("price_try=?");
            updateValues.push(price_try || 0);
        }
        if (price_syp !== undefined) {
            updateFields.push("price_syp=?");
            updateValues.push(price_syp || 0);
        }

        // إضافة updated_at و product_id
        updateFields.push("updated_at=NOW()");
        updateValues.push(product_id);

        if (updateFields.length > 1) { // إذا كان هناك حقول للتحديث
            const updateQuery = `UPDATE products SET ${updateFields.join(', ')} WHERE product_id=?`;
            await connection.queryAsync(updateQuery, updateValues);
        }

        const updatedProduct = {
            product_id,
            product_code: product_code !== undefined ? product_code : currentProduct.product_code,
            product_name: product_name !== undefined ? product_name : currentProduct.product_name,
            product_description: product_description !== undefined ? (product_description || "") : currentProduct.product_description,
            product_category: product_category !== undefined ? product_category : currentProduct.product_category,
            price_usd: price_usd !== undefined ? (price_usd || 0) : currentProduct.price_usd,
            price_try: price_try !== undefined ? (price_try || 0) : currentProduct.price_try,
            price_syp: price_syp !== undefined ? (price_syp || 0) : currentProduct.price_syp,
            colors: [],
            images: []
        };

        // معالجة الألوان والمقاسات
        if (Array.isArray(colors) && colors.length > 0) {
            for (const color of colors) {
                const { color_id, color_name, color_value, sizes, remove_color } = color;

                // حذف اللون إذا تم تحديده
                if (remove_color && color_id) {
                    await connection.queryAsync(
                        "DELETE FROM product_colors WHERE color_id=?",
                        [color_id]
                    );
                    continue;
                }

                let currentColorId = color_id;

                // التحقق من أن color_id يعود لهذا المنتج
                if (currentColorId) {
                    const colorValidation = await connection.queryAsync(
                        "SELECT color_id FROM product_colors WHERE color_id = ? AND product_id = ? LIMIT 1",
                        [currentColorId, product_id]
                    );

                    if (colorValidation.length === 0) {
                        await connection.queryAsync("ROLLBACK");
                        return res.status(400).json({
                            status: 400,
                            success: false,
                            message: `color_id ${currentColorId} لا ينتمي لهذا المنتج`
                        });
                    }
                }

                // البحث عن لون موجود لهذا المنتج بنفس الاسم أو القيمة
                if (!currentColorId && (color_name || color_value)) {
                    const existingColor = await connection.queryAsync(
                        "SELECT color_id FROM product_colors WHERE product_id = ? AND (color_name = ? OR color_value = ?) LIMIT 1",
                        [product_id, color_name || null, color_value || null]
                    );

                    if (existingColor.length > 0) {
                        currentColorId = existingColor[0].color_id;
                    }
                }

                // إضافة لون جديد إذا لم يكن موجودًا
                if (!currentColorId && (color_name || color_value)) {
                    const colorInsert = await connection.queryAsync(
                        "INSERT INTO product_colors (product_id, color_name, color_value) VALUES (?, ?, ?)",
                        [product_id, color_name || null, color_value || null]
                    );
                    currentColorId = colorInsert.insertId;
                } else if (currentColorId && (color_name || color_value)) {
                    // تعديل لون موجود
                    await connection.queryAsync(
                        "UPDATE product_colors SET color_name=?, color_value=? WHERE color_id=?",
                        [color_name || null, color_value || null, currentColorId]
                    );
                }

                const colorData = {
                    color_id: currentColorId,
                    color_name: color_name || null,
                    color_value: color_value || null,
                    sizes: []
                };

                // معالجة المقاسات
                if (Array.isArray(sizes) && sizes.length > 0) {
                    for (const size of sizes) {
                        const { size_id, size_value, quantity, remove_size } = size;

                        if (remove_size && size_id) {
                            await connection.queryAsync(
                                "DELETE FROM product_sizes WHERE size_id=?",
                                [size_id]
                            );
                            continue;
                        }

                        let currentSizeId = size_id;

                        // التحقق من أن size_id يعود لهذا اللون والمنتج
                        if (currentSizeId) {
                            const sizeValidation = await connection.queryAsync(
                                `SELECT ps.size_id 
                                 FROM product_sizes ps 
                                 JOIN product_colors pc ON ps.color_id = pc.color_id 
                                 WHERE ps.size_id = ? AND pc.color_id = ? AND pc.product_id = ? 
                                 LIMIT 1`,
                                [currentSizeId, currentColorId, product_id]
                            );

                            if (sizeValidation.length === 0) {
                                await connection.queryAsync("ROLLBACK");
                                return res.status(400).json({
                                    status: 400,
                                    success: false,
                                    message: `size_id ${currentSizeId} لا ينتمي لهذا اللون أو المنتج`
                                });
                            }
                        }

                        // البحث عن مقاس موجود لهذا اللون بنفس القيمة
                        if (!currentSizeId && size_value) {
                            const existingSize = await connection.queryAsync(
                                "SELECT size_id FROM product_sizes WHERE color_id = ? AND size_value = ? LIMIT 1",
                                [currentColorId, size_value]
                            );

                            if (existingSize.length > 0) {
                                currentSizeId = existingSize[0].size_id;
                            }
                        }

                        if (!currentSizeId && size_value) {
                            const sizeInsert = await connection.queryAsync(
                                "INSERT INTO product_sizes (color_id, size_value, quantity) VALUES (?, ?, ?)",
                                [currentColorId, size_value, quantity || 0]
                            );
                            currentSizeId = sizeInsert.insertId;
                        } else if (currentSizeId && size_value) {
                            // تحديث مقاس موجود
                            await connection.queryAsync(
                                "UPDATE product_sizes SET size_value=?, quantity=? WHERE size_id=?",
                                [size_value, quantity || 0, currentSizeId]
                            );
                        }

                        colorData.sizes.push({
                            size_id: currentSizeId,
                            size_value,
                            quantity: quantity || 0
                        });
                    }
                }

                updatedProduct.colors.push(colorData);
            }
        }

        // رفع الصور الجديدة إن وجدت
        const files = req.files || [];
        if (files.length > 0) {
            // التحقق من عدد الصور الحالية
            const existingImages = await connection.queryAsync(
                "SELECT image_id FROM product_images WHERE product_id = ?",
                [product_id]
            );

            if (existingImages.length + files.length > 20) {
                await connection.queryAsync("ROLLBACK");
                return res.status(400).json({
                    status: 400,
                    success: false,
                    message: `الحد الأقصى للصور هو 20. العدد الحالي: ${existingImages.length}`
                });
            }

            // تحديد إذا كانت هذه أول صورة
            const hasMainImage = await connection.queryAsync(
                "SELECT image_id FROM product_images WHERE product_id = ? AND is_main = 1",
                [product_id]
            );
            let isFirst = hasMainImage.length === 0;

            for (const file of files) {
                try {
                    const uploadResult = await uploadImageToCloudinary(file, product_id);

                    await connection.queryAsync(
                        "INSERT INTO product_images (product_id, image_url, public_id, is_main) VALUES (?, ?, ?, ?)",
                        [product_id, uploadResult.secure_url, uploadResult.public_id, isFirst ? 1 : 0]
                    );

                    updatedProduct.images.push({
                        image_url: uploadResult.secure_url,
                        public_id: uploadResult.public_id,
                        is_main: isFirst
                    });

                    isFirst = false;
                } catch (uploadError) {
                    console.error("Image upload error:", uploadError);
                }
            }
        }

        await connection.queryAsync("COMMIT");

        return res.status(200).json({
            status: 200,
            success: true,
            message: "تم تعديل المنتج بنجاح",
            product: updatedProduct
        });

    } catch (error) {
        if (connection) await connection.queryAsync("ROLLBACK");
        console.error("Update Product Error:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء تعديل المنتج",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { updateProduct };
