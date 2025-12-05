const admin = require("firebase-admin");
const path = require("path");

// قراءة المسار من .env
const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_JSON_PATH;

// تحميل ملف JSON
const serviceAccount = require(path.resolve(serviceAccountPath));

// تهيئة Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;
