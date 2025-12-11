/**
 * Create Super Admin Script
 * سكريبت إنشاء حساب Super Admin الأولي
 * 
 * تشغيل: node src/modules/auth/create_superadmin.js
 */

require("dotenv").config();
const pool = require("../../config/dbconnect");
const bcrypt = require("bcrypt");

const checkExistingSuperAdmin = async () => {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT user_id FROM users WHERE role = 'super_admin' LIMIT 1",
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

const createSuperAdminUser = async (fullName, email, hashedPassword, phone) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO users (full_name, email, password, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    pool.query(
      sql,
      [fullName, email, hashedPassword, phone, "super_admin"],
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

const setupSuperAdmin = async () => {
  try {
    console.log("🔍 Checking for existing Super Admin...");

    const existingSuper = await checkExistingSuperAdmin();

    if (existingSuper.length > 0) {
      console.log("✅ Super Admin موجود مسبقاً.");
      process.exit(0);
    }

    console.log("🔐 Creating SUPER ADMIN...");

    const full_name = "solin ahmad";
    const email = "superadmin@example.com";
    const password = "60136013";
    const phone = "+963932719218";

    const hashedPassword = await bcrypt.hash(password, 10);
    await createSuperAdminUser(full_name, email, hashedPassword, phone);

    console.log("✅ SUPER ADMIN created successfully!");
    console.log("📧 Email:", email);
    console.log("🔑 Password:", password);
    console.log("⚠️  مهم: غيري كلمة السر لاحقًا من الداشبورد.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

setupSuperAdmin();