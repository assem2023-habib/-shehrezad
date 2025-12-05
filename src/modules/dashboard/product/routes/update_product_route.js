const express = require("express");
const router = express.Router();

const { verifyToken, checkRole } = require("../../../../middleware/verifytoken");
const { validateProductUpdate } = require("../../../../middleware/validate_product_info");
const upload = require("../../../../middleware/multer");
const { updateProduct } = require("../controllers/update_product_controller");

// راوت تعديل منتج مع دعم رفع الصور
router.put("/update-product/:product_id", verifyToken, checkRole(["super_admin", "employee"]), upload.array("images", 20), validateProductUpdate, updateProduct);

module.exports = router;
