/**
 * Database Setup Script
 * سكريبت إنشاء قاعدة البيانات والجداول
 * 
 * تشغيل: node src/config/createdb.js
 */

require('dotenv').config();
const { setupDatabase } = require('./database/setup');

setupDatabase();
