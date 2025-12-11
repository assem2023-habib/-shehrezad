const { query } = require('./connection');

async function addCouponFieldsToOrders() {
    try {
        await query("ALTER TABLE orders ADD COLUMN coupon_id INT NULL");
        await query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0");
        await query("ALTER TABLE orders ADD CONSTRAINT fk_order_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)");
        console.log("✅ Table 'orders' updated with coupon fields");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on orders update: " + e.message);
        }
    }
}

async function fixCartsUniqueConstraint() {
    try {
        try {
            await query("CREATE INDEX idx_user_id_regular ON carts(user_id)");
        } catch (idxErr) {
            // تجاهل الخطأ إذا كان الفهرس موجوداً
        }

        await query("ALTER TABLE carts DROP INDEX user_id");
        console.log("✅ Fixed carts table: Removed UNIQUE constraint from user_id");
    } catch (e) {
        if (!e.message.includes("check that column/key exists")) {
            console.log("ℹ️ Note on carts fix: " + e.message);
        }
    }
}

async function addIsShowToProducts() {
    try {
        await query("ALTER TABLE products ADD COLUMN is_show TINYINT DEFAULT 1");
        console.log("✅ Added is_show column to products table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on products is_show: " + e.message);
        }
    }
}

async function addConfirmedByToOrders() {
    try {
        await query("ALTER TABLE orders ADD COLUMN confirmed_by INT NULL");
        await query("ALTER TABLE orders ADD CONSTRAINT fk_order_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(user_id)");
        console.log("✅ Added confirmed_by column to orders table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on orders confirmed_by: " + e.message);
        }
    }
}

async function addInvoiceImageToUsers() {
    try {
        await query("ALTER TABLE users ADD COLUMN invoice_image VARCHAR(255)");
        console.log("✅ Added invoice_image column to users table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on users invoice_image: " + e.message);
        }
    }
}

async function addNotesAndCurrencyToOrders() {
    try {
        await query("ALTER TABLE orders ADD COLUMN customer_note TEXT NULL");
        await query("ALTER TABLE orders ADD COLUMN cart_note TEXT NULL");
        await query("ALTER TABLE orders ADD COLUMN currency ENUM('USD','TRY','SYP') DEFAULT 'TRY'");
        console.log("✅ Added notes and currency columns to orders table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on orders notes/currency: " + e.message);
        }
    }
}

async function updateOrdersStatusEnum() {
    try {
        await query("ALTER TABLE orders MODIFY COLUMN status ENUM('unpaid','paid','pending','processing','shipped','completed','cancelled') DEFAULT 'unpaid'");
        console.log("✅ Updated orders.status ENUM to include 'unpaid' with default");
    } catch (e) {
        if (!e.message.includes("Duplicate column name") && !e.message.includes("DATA TYPE")) {
            console.log("ℹ️ Note on orders status enum: " + e.message);
        }
    }
}

async function addCurrencyToCustomerDebts() {
    try {
        await query("ALTER TABLE customer_debts ADD COLUMN currency ENUM('USD','TRY','SYP') DEFAULT 'TRY'");
        console.log("✅ Added currency column to customer_debts table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on debts currency: " + e.message);
        }
    }
}

async function addTokenToProducts() {
    try {
        await query("ALTER TABLE products ADD COLUMN token VARCHAR(100) UNIQUE");
        console.log("✅ Added token column to products table");
    } catch (e) {
        if (!e.message.includes("Duplicate column name")) {
            console.log("ℹ️ Note on products token: " + e.message);
        }
    }
}

async function runAllMigrations() {
    await addCouponFieldsToOrders();
    await fixCartsUniqueConstraint();
    await addIsShowToProducts();
    await addConfirmedByToOrders();
    await addInvoiceImageToUsers();
    await addNotesAndCurrencyToOrders();
    await updateOrdersStatusEnum();
    await addCurrencyToCustomerDebts();
    await addTokenToProducts();
}

module.exports = {
    runAllMigrations,
    addCouponFieldsToOrders,
    fixCartsUniqueConstraint,
    addIsShowToProducts,
    addConfirmedByToOrders,
    addInvoiceImageToUsers,
    addNotesAndCurrencyToOrders,
    updateOrdersStatusEnum,
    addCurrencyToCustomerDebts,
    addTokenToProducts
};
