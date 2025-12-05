const express = require("express");
const router = express.Router();

const { verifyToken, checkRole } = require("../../../../middleware/verifytoken");
const {deleteProduct} = require("../../product/controllers/delete_product_controller");

router.delete("/delete/:product_id",verifyToken,checkRole(["super_admin", "employee"]),deleteProduct);

module.exports = router;
