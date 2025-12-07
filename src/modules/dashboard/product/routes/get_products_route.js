/**
 * Dashboard Get Products Route
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { getProducts } = require('../controllers/get_products_controller');

// يتطلب توكن + employee/super_admin
router.get('/products', verifyToken, checkRole(['super_admin', 'employee']), getProducts);

module.exports = router;
