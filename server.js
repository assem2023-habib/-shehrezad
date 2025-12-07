require('dotenv').config();
const express = require('express');
const app = require("./src/app");
const db = require("./src/config/dbconnect");
const { startCronJobs } = require("./src/config/cron_jobs");

const PORT = process.env.PORT||5000;
const server = app.listen(PORT,()=>{
    console.log('Server listening on port ' + PORT);
    startCronJobs();
})



// 201 → إنشاء جديد

// 200 → نجاح جلب البيانات

// 500 → خطأ سيرفر

// 400 → بيانات مكررة أو خاطئة او خطا في ادخال البيانات

// 401 → عدم وجود البيانات المطلوبة أو مشكلة مصادقة

// عدم نجاح عملية رفع الصور 404

// خطا في ال url → 404


