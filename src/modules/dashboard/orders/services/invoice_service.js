/**
 * Invoice Service - خدمة توليد الفواتير PDF
 * يدعم اللغة العربية والإنجليزية
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const pool = require('../../../../config/dbconnect');
const { settingsService } = require('../../../../config/database');

// مسار الخط العربي
const ARABIC_FONT_PATH = path.join(__dirname, '../../../../assets/fonts/NotoSansArabic-Regular.ttf');

/**
 * جلب بيانات الطلب الكاملة للفاتورة
 */
const getOrderDataForInvoice = async (orderId) => {
  const orders = await pool.query(`
    SELECT 
      o.*,
      u.full_name,
      u.phone,
      u.email,
      u.customer_code,
      i.invoice_number,
      i.issue_date,
      i.status as invoice_status
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    LEFT JOIN invoices i ON o.order_id = i.order_id
    WHERE o.order_id = ?
  `, [orderId]);

  if (!orders.length) return null;
  const order = orders[0];

  const items = await pool.query(`
    SELECT 
      oi.*,
      p.product_name,
      p.product_code,
      pc.color_name,
      ps.size_value
    FROM order_items oi
    JOIN products p ON oi.product_id = p.product_id
    JOIN product_colors pc ON oi.color_id = pc.color_id
    JOIN product_sizes ps ON oi.size_id = ps.size_id
    WHERE oi.order_id = ?
  `, [orderId]);

  return { ...order, items };
};

/**
 * توليد فاتورة PDF
 */
const generateInvoicePDF = async (orderId) => {
  const orderData = await getOrderDataForInvoice(orderId);

  if (!orderData) {
    throw new Error('Order not found');
  }

  const storeName = await settingsService.get('store_name') || 'Shehrezad';
  const storePhone = await settingsService.get('store_phone') || '';
  const storeAddress = await settingsService.get('store_address') || '';

  // التحقق من وجود الخط العربي
  const hasArabicFont = fs.existsSync(ARABIC_FONT_PATH);

  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${orderData.invoice_number || orderId}`,
          Author: storeName
        }
      });

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // تسجيل الخط العربي
      if (hasArabicFont) {
        doc.registerFont('Arabic', ARABIC_FONT_PATH);
      }

      // دالة مساعدة للنص - استخدام الخط العربي إذا كان النص يحتوي على عربي
      const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);
      const writeText = (text, options = {}) => {
        const str = String(text || '');
        if (hasArabicFont && hasArabic(str)) {
          doc.font('Arabic');
        } else {
          doc.font('Helvetica');
        }
        doc.text(str, options);
        doc.font('Helvetica');
      };

      // ===== رأس الفاتورة =====
      doc.fontSize(24);
      writeText(storeName, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10);
      writeText(storePhone, { align: 'center' });
      writeText(storeAddress, { align: 'center' });
      doc.moveDown();

      // خط فاصل
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown();

      // ===== عنوان الفاتورة =====
      doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.font('Helvetica');
      doc.moveDown();

      const invoiceInfoY = doc.y;

      // معلومات الفاتورة (يسار)
      doc.fontSize(10);
      doc.text(`Invoice #: ${orderData.invoice_number || 'N/A'}`, 50, invoiceInfoY);
      doc.text(`Date: ${new Date(orderData.created_at).toLocaleDateString('en-US')}`, 50);
      doc.text(`Order ID: ${orderData.order_id}`, 50);

      // معلومات العميل (يمين)
      doc.text('Customer:', 300, invoiceInfoY);
      // اسم العميل (قد يكون عربي)
      if (hasArabicFont && hasArabic(orderData.full_name)) {
        doc.font('Arabic');
      }
      doc.text(orderData.full_name || 'N/A', 360, doc.y - 12);
      doc.font('Helvetica');
      doc.text(`Code: ${orderData.customer_code || 'N/A'}`, 300);
      doc.text(`Phone: ${orderData.phone || 'N/A'}`, 300);

      doc.moveDown(2);

      // ===== جدول المنتجات =====
      const tableTop = doc.y;
      const tableHeaders = ['#', 'Product', 'Color', 'Size', 'Qty', 'Price', 'Total'];
      const colWidths = [25, 165, 70, 45, 35, 70, 85];
      let xPos = 50;

      // رأس الجدول
      doc.rect(50, tableTop, 495, 20).fill('#e0e0e0');
      doc.fillColor('#000000');

      doc.font('Helvetica-Bold').fontSize(9);
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + 3, tableTop + 5, { width: colWidths[i] - 6 });
        xPos += colWidths[i];
      });
      doc.font('Helvetica').fontSize(9);

      // صفوف المنتجات
      let rowY = tableTop + 25;
      orderData.items.forEach((item, index) => {
        xPos = 50;
        const itemPrice = parseFloat(item.price_at_purchase || 0);

        // الخلفية للصفوف الفردية
        if (index % 2 === 1) {
          doc.rect(50, rowY - 3, 495, 18).fill('#f5f5f5');
          doc.fillColor('#000000');
        }

        // رقم الصف
        doc.text((index + 1).toString(), xPos + 3, rowY, { width: colWidths[0] - 6 });
        xPos += colWidths[0];

        // اسم المنتج (قد يكون عربي)
        const productName = item.product_name || item.product_code || '-';
        if (hasArabicFont && hasArabic(productName)) {
          doc.font('Arabic');
        }
        doc.text(productName, xPos + 3, rowY, { width: colWidths[1] - 6, lineBreak: false });
        doc.font('Helvetica');
        xPos += colWidths[1];

        // اللون (قد يكون عربي)
        const colorName = item.color_name || '-';
        if (hasArabicFont && hasArabic(colorName)) {
          doc.font('Arabic');
        }
        doc.text(colorName, xPos + 3, rowY, { width: colWidths[2] - 6 });
        doc.font('Helvetica');
        xPos += colWidths[2];

        // المقاس
        doc.text(item.size_value || '-', xPos + 3, rowY, { width: colWidths[3] - 6 });
        xPos += colWidths[3];

        // الكمية
        doc.text(item.quantity.toString(), xPos + 3, rowY, { width: colWidths[4] - 6 });
        xPos += colWidths[4];

        // السعر
        doc.text(`${itemPrice.toFixed(2)}`, xPos + 3, rowY, { width: colWidths[5] - 6 });
        xPos += colWidths[5];

        // الإجمالي
        doc.text(`${(itemPrice * item.quantity).toFixed(2)}`, xPos + 3, rowY, { width: colWidths[6] - 6 });

        rowY += 20;
      });

      // خط فاصل تحت الجدول
      doc.moveTo(50, rowY + 5).lineTo(545, rowY + 5).stroke();

      // ===== الإجماليات =====
      const totalsY = rowY + 25;
      doc.fontSize(11);

      const totalAmount = parseFloat(orderData.total_amount || 0);
      const discountAmount = parseFloat(orderData.discount_amount || 0);
      const subtotal = totalAmount + discountAmount;

      // Subtotal
      doc.text('Subtotal:', 380, totalsY);
      doc.text(`${subtotal.toFixed(2)} TRY`, 460, totalsY, { align: 'right', width: 85 });

      // Discount
      let currentY = totalsY + 18;
      if (discountAmount > 0) {
        doc.fillColor('#cc0000');
        doc.text('Discount:', 380, currentY);
        doc.text(`-${discountAmount.toFixed(2)} TRY`, 460, currentY, { align: 'right', width: 85 });
        doc.fillColor('#000000');
        currentY += 18;
      }

      // Total
      doc.fontSize(13).font('Helvetica-Bold');
      doc.text('TOTAL:', 380, currentY);
      doc.text(`${totalAmount.toFixed(2)} TRY`, 460, currentY, { align: 'right', width: 85 });
      doc.font('Helvetica');

      // ===== تذييل الفاتورة =====
      doc.fontSize(10);
      doc.text('Thank you for your business!', 50, 720, { align: 'center', width: 495 });

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  getOrderDataForInvoice
};
