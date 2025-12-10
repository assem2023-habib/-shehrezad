(async () => {
  const fs = require('fs');
  const path = require('path');
  const loadEnv = () => {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split(/\r?\n/).forEach(line => {
          const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
          if (m) {
            let val = m[2];
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!(m[1] in process.env)) process.env[m[1]] = val;
          }
        });
      }
    } catch (_) { }
  };

  loadEnv();

  const express = require('express');
  const app = require("./src/app");
  const db = require("./src/config/dbconnect");
  const { startCronJobs } = require("./src/config/cron_jobs");

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log('Server listening on port ' + PORT);
    startCronJobs();
  });
})();



// 201 → إنشاء جديد

// 200 → نجاح جلب البيانات

// 500 → خطأ سيرفر

// 400 → بيانات مكررة أو خاطئة او خطا في ادخال البيانات

// 401 → عدم وجود البيانات المطلوبة أو مشكلة مصادقة

// عدم نجاح عملية رفع الصور 404

// خطا في ال url → 404


