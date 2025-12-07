const pool = require("../../../../config/dbconnect");

const deleteProduct = async (req, res) => {
    let connection;

    try {
        connection = await pool.getConnectionAsync();
        await connection.queryAsync("START TRANSACTION");

        const { product_id } = req.params;

        // التحقق من وجود المنتج
        const checkProduct = await connection.queryAsync(
            "SELECT product_id FROM products WHERE product_id = ?",
            [product_id]
        );

        if (!checkProduct.length) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "المنتج غير موجود"
            });
        }

        // حذف المقاسات المرتبطة بالألوان
        await connection.queryAsync(
            `DELETE ps FROM product_sizes ps 
             JOIN product_colors pc ON ps.color_id = pc.color_id
             WHERE pc.product_id = ?`,
            [product_id]
        );

        // حذف الألوان
        await connection.queryAsync(
            "DELETE FROM product_colors WHERE product_id = ?",
            [product_id]
        );

        // حذف المنتج نفسه
        await connection.queryAsync(
            "DELETE FROM products WHERE product_id = ?",
            [product_id]
        );

        await connection.queryAsync("COMMIT");

        return res.status(200).json({
            status: 200,
            success: true,
            message: "تم حذف المنتج بنجاح"
        });

    } catch (error) {
        if (connection) await connection.queryAsync("ROLLBACK");
        console.error("Delete Product Error:", error);

        return res.status(500).json({
            status: 500,
            success: false,
            message: "حدث خطأ أثناء حذف المنتج",
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { deleteProduct };
