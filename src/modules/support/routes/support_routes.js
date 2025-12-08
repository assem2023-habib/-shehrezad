const express = require('express');
const router = express.Router();
const { getSupportNumbers } = require('../controllers/support_controller');

// عام بدون توكن: جلب أرقام موظفي الدعم
router.get('/numbers', getSupportNumbers);

module.exports = router;

