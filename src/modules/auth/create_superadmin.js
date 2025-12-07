require("dotenv").config();
const pool = require("../../config/dbconnect");
const bcrypt = require("bcrypt");

console.log("Checking for existing Super Admin...");

pool.query(
  "SELECT user_id FROM users WHERE role = 'super_admin' LIMIT 1",
  async (err, rows) => {
    if (err) {
      console.error("Error checking super admin:", err);
      process.exit(1);
    }

    if (rows.length > 0) {
      console.log("Super Admin موجود مسبقاً.");
      process.exit(0);
    }

    console.log("Creating SUPER ADMIN...");

    // البيانات الافتراضية
    const full_name = "solin ahmad";
    const email = "superadmin@example.com";
    const password = "60136013";
    const phone = "+963932719218";
    const role = "super_admin";

    try {
      // تشفير كلمة السر
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO users (full_name, email, password, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `;

      pool.query(
        sql,
        [full_name, email, hashedPassword, phone, role],
        (err2, result) => {
          if (err2) {
            console.error("Error creating super admin:", err2);
            process.exit(1);
          }

          console.log("SUPER ADMIN created successfully!");
          console.log("Email:", email);
          console.log("Password:", password);
          console.log("مهم: غيري كلمة السر لاحقًا من الداشبورد.");
          process.exit(0);
        }
      );

    } catch (hashError) {
      console.error("Error hashing password:", hashError);
      process.exit(1);
    }
  }
);

// node src/modules/auth/create_superadmin.js