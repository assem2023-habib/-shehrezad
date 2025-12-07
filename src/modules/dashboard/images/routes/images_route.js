const express = require("express");
const router = express.Router();
const upload = require("../../../../middleware/multer");
const { verifyToken, checkRole } = require("../../../../middleware/verifytoken");

const { addProductImages } = require("../controller/upload_images_controller");
const { deleteProductImages } = require("../controller/delete_images_controller");

// رفع الصور
router.post( "/upload",verifyToken,checkRole(["super_admin", "employee"]),upload.array("images", 20),addProductImages);

// حذف الصور
router.post("/delete",verifyToken,checkRole(["super_admin", "employee"]),deleteProductImages);

module.exports = router;
