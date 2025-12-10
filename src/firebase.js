const path = require("path");

let adminInstance = null;

const getAdmin = async () => {
  if (adminInstance) return adminInstance;

  const { default: admin } = await import('firebase-admin');

  const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_JSON_PATH;
  const serviceAccount = require(path.resolve(serviceAccountPath));

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {}

  adminInstance = admin;
  return adminInstance;
};

module.exports = { getAdmin };
