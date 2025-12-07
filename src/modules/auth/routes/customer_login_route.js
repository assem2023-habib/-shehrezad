/**
 * Customer Login Route
 */

const express = require('express');
const router = express.Router();
const { customerLogin } = require('../controllers/customer_login_controller');

router.post('/customer-login', customerLogin);

module.exports = router;
