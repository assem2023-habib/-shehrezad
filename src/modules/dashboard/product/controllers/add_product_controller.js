const pool = require("../../../../config/dbconnect");
const cloudinary = require("../../../../config/cloudinary");
const { getAdmin } = require("../../../../firebase");
/**
 * توليد كود منتج فريد
 * الصيغة: PRD-XXXXXX (حروف وأرقام عشوائية)
 */
const generateProductCode = async (connection) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // بدون O,0,I,1 لتجنب الالتباس
  let code;
  let exists = true;

  while (exists) {
    code = 'PRD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // التحقق من عدم التكرار
    const check = await connection.queryAsync(
      'SELECT product_id FROM products WHERE product_code = ?',
      [code]
    );
    exists = check.length > 0;
  }

  return code;
};

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

const addProduct = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnectionAsync();
    await connection.queryAsync("START TRANSACTION");

    const {
      product_name,
      product_description,
      product_category,
      price_usd,
      price_try,
      price_syp,
      colors
    } = req.body;

    // Parse colors if it's a string (from form-data)
    let parsedColors = colors;
    if (typeof colors === 'string') {
      try {
        parsedColors = JSON.parse(colors);
      } catch (e) {
        await connection.queryAsync("ROLLBACK");
        return res.status(400).json({
          status: 400,
          success: false,
          message: "صيغة الألوان غير صحيحة"
        });
      }
    }

    // توليد كود المنتج تلقائياً
    const product_code = await generateProductCode(connection);

    // إدخال المنتج
    const insertProduct = await connection.queryAsync(
      `INSERT INTO products 
       (product_code, product_name, product_description, product_category,
        price_usd, price_try, price_syp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        product_code,
        product_name,
        product_description || "",
        product_category,
        price_usd || 0,
        price_try || 0,
        price_syp || 0
      ]
    );
    const product_id = insertProduct.insertId;

    const productData = {
      product_id,
      product_code,
      product_name,
      product_description: product_description || "",
      product_category,
      price_usd: price_usd || 0,
      price_try: price_try || 0,
      price_syp: price_syp || 0,
      colors: [],
      images: []
    };

    // إضافة الألوان والمقاسات
    if (!Array.isArray(parsedColors) || parsedColors.length === 0) {
      await connection.queryAsync("ROLLBACK");
      return res.status(400).json({
        status: 400,
        success: false,
        message: "يجب إضافة لون واحد على الأقل"
      });
    }

    for (const color of parsedColors) {
      const { color_name, color_value, sizes } = color;

      if (!color_name && !color_value) {
        await connection.queryAsync("ROLLBACK");
        return res.status(400).json({
          status: 400,
          success: false,
          message: "يجب إدخال قيمة واحدة على الأقل للون (color_name أو color_value)"
        });
      }

      const colorInsert = await connection.queryAsync(
        "INSERT INTO product_colors (product_id, color_name, color_value) VALUES (?, ?, ?)",
        [product_id, color_name || null, color_value || null]
      );
      const color_id = colorInsert.insertId;

      const colorData = {
        color_id,
        color_name: color_name || null,
        color_value: color_value || null,
        sizes: []
      };

      if (!Array.isArray(sizes) || sizes.length === 0) {
        await connection.queryAsync("ROLLBACK");
        return res.status(400).json({
          status: 400,
          success: false,
          message: `يجب إضافة مقاس واحد على الأقل للون ${color_name || color_value}`
        });
      }

      for (const size of sizes) {
        const { size_value, quantity } = size;

        if (!size_value) {
          await connection.queryAsync("ROLLBACK");
          return res.status(400).json({
            status: 400,
            success: false,
            message: `المقاس غير موجود ضمن اللون ${color_name || color_value}`
          });
        }

        const sizeInsert = await connection.queryAsync(
          `INSERT INTO product_sizes (color_id, size_value, quantity)
           VALUES (?, ?, ?)`,
          [color_id, size_value, quantity || 0]
        );

        colorData.sizes.push({
          size_id: sizeInsert.insertId,
          size_value,
          quantity: quantity || 0
        });
      }

      productData.colors.push(colorData);
    }

    // رفع الصور إن وجدت
    const files = req.files || [];
    if (files.length > 0) {
      if (files.length > 20) {
        await connection.queryAsync("ROLLBACK");
        return res.status(400).json({
          status: 400,
          success: false,
          message: "الحد الأقصى للصور هو 20"
        });
      }

      let isFirst = true;
      for (const file of files) {
        try {
          const uploadResult = await uploadImageToCloudinary(file, product_id);

          await connection.queryAsync(
            "INSERT INTO product_images (product_id, image_url, public_id, is_main) VALUES (?, ?, ?, ?)",
            [product_id, uploadResult.secure_url, uploadResult.public_id, isFirst ? 1 : 0]
          );

          productData.images.push({
            image_url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            is_main: isFirst
          });

          isFirst = false;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          // Continue with other images even if one fails
        }
      }
    }

    await connection.queryAsync("COMMIT");

    getAdmin.messaging().send({
      notification: {
        title: "منتج جديد!",
        body: `تم إضافة المنتج "${product_name}" الآن 🎉`
      },
      topic: "all_users"
    }).catch(err => console.error("FCM Error:", err));

    return res.status(200).json({
      status: 200,
      success: true,
      message: "تمت إضافة المنتج بنجاح",
      product: productData
    });

    const admin = await getAdmin();
    admin.messaging().send({
      notification: {
        title: "منتج جديد!",
        body: `تم إضافة المنتج "${product_name}" الآن 🎉`
      },
      topic: "all_users"
    }).catch(err => console.error("FCM Error:", err));

    return res.status(200).json({
      status: 200,
      success: true,
      message: "تمت إضافة المنتج بنجاح",
      product: productData
    });



  } catch (error) {
    if (connection) await connection.queryAsync("ROLLBACK");
    console.error("Add Product Error:", error);
    return res.status(500).json({
      status: 500,
      success: false,
      message: "حدث خطأ أثناء إضافة المنتج",
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = { addProduct };
