const multer = require("multer");

// تخزين الملفات مؤقتاً في الذاكرة
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
