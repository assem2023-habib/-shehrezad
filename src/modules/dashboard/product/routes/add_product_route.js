const express = require("express");
const router = express.Router();

const { verifyToken, checkRole } = require("../../../../middleware/verifytoken");
const { validateProduct } = require("../../../../middleware/validate_product_info");
const upload = require("../../../../middleware/multer");
const { addProduct } = require("../controllers/add_product_controller");


// راوت إضافة منتج جديد مع دعم رفع الصور
router.post("/add-product", verifyToken, checkRole(["super_admin", "employee"]), upload.array("images", 20), validateProduct, addProduct);

module.exports = router;
