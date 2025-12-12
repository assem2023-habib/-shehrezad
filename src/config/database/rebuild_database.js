/**
 * إعادة بناء قاعدة البيانات بالكامل
 * ⚠️ تحذير: هذا سيحذف جميع البيانات الموجودة!
 */

require('dotenv').config();
const pool = require('../dbconnect');
const { createTables } = require('./init');

async function rebuildDatabase() {
    try {
        console.log('\n⚠️  إعادة بناء قاعدة البيانات بالكامل...\n');
        console.log('⚠️  سيتم حذف جميع الجداول والبيانات!\n');

        const dbName = process.env.DB_NAME;
        
        // حذف قاعدة البيانات
        console.log(`[1/3] حذف قاعدة البيانات ${dbName}...`);
        await pool.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log('✅ تم حذف قاعدة البيانات');

        // إنشاء قاعدة البيانات من جديد
        console.log(`\n[2/3] إنشاء قاعدة البيانات ${dbName}...`);
        await pool.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ تم إنشاء قاعدة البيانات');

        // إعادة الاتصال بقاعدة البيانات الجديدة
        await pool.query(`USE ${dbName}`);

        // إنشاء الجداول
        console.log('\n[3/3] إنشاء الجداول...\n');
        await createTables();
        
        console.log('\n✅ تمت إعادة بناء قاعدة البيانات بنجاح!\n');
        
        process.exit(0);

    } catch (error) {
        console.error('\n❌ خطأ أثناء إعادة بناء قاعدة البيانات:', error);
        process.exit(1);
    }
}

// تأكيد من المستخدم
console.log('\n⚠️⚠️⚠️  تحذير  ⚠️⚠️⚠️');
console.log('سيتم حذف قاعدة البيانات بالكامل وجميع البيانات!');
console.log('\nللمتابعة، قم بتشغيل:');
console.log('node src/config/database/rebuild_database.js --confirm\n');

if (process.argv.includes('--confirm')) {
    rebuildDatabase();
} else {
    console.log('تم الإلغاء. لم يتم تنفيذ أي تغييرات.\n');
    process.exit(0);
}
