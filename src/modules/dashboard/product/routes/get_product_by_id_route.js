/**
 * Dashboard Get Product By ID Route
 */

const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../../../middleware/verifytoken');
const { USER_ROLES } = require('../../../../config/constants');
const getProductByIdController = require('../controllers/get_product_by_id_controller');

router.use(verifyToken);
router.use(checkRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN]));

router.get('/:id', getProductByIdController.getProductById);

module.exports = router;
