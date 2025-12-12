const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { query } = require('../../../../config/dbconnect');

function numberWithCommas(x) {
  if (x === null || x === undefined) return '';
  return Number(x).toLocaleString('en-US');
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function readLogoData() {
  const logoPath = path.join(__dirname, '../../templates/assets/logo.jpg');
  try {
    const b = fs.readFileSync(logoPath);
    const ext = path.extname(logoPath).replace('.', '') || 'png';
    return `data:image/${ext};base64,${b.toString('base64')}`;
  } catch (e) {
    return '';
  }
}

async function getOrderFromDB(orderId) {
  const orderSql = `
    SELECT o.*, inv.invoice_number, inv.issue_date, inv.status AS invoice_status,
           u.user_id AS customer_user_id, u.full_name, u.phone, u.invoice_image, u.email
    FROM orders o
    LEFT JOIN invoices inv ON inv.order_id = o.order_id
    LEFT JOIN users u ON u.user_id = o.user_id
    WHERE o.order_id = ?
    LIMIT 1
  `;
  const orderRows = await query(orderSql, [orderId]);
  if (!orderRows || orderRows.length === 0) throw new Error('Order not found');
  const ord = orderRows[0];

  const itemsSql = `
    SELECT oi.*, p.product_name, p.product_code,
           pc.color_name, pc.color_value,
           ps.size_value,
           pi.image_url
    FROM order_items oi
    LEFT JOIN products p ON p.product_id = oi.product_id
    LEFT JOIN product_colors pc ON pc.color_id = oi.color_id
    LEFT JOIN product_sizes ps ON ps.size_id = oi.size_id
    LEFT JOIN product_images pi ON pi.product_id = p.product_id AND pi.is_main = 1
    WHERE oi.order_id = ?
  `;
  const itemsRows = await query(itemsSql, [orderId]);

  const items = (itemsRows || []).map(i => ({
    item_id: i.item_id,
    product_id: i.product_id,
    product_name: i.product_name || '',
    product_code: i.product_code || '',
    color_name: i.color_name || '',
    color_value: i.color_value || '',
    size_value: i.size_value || '',
    quantity: i.quantity,
    price_at_purchase: i.price_at_purchase,
    total: (i.quantity || 0) * (i.price_at_purchase || 0),
    image_url: i.image_url || ''
  }));

  const totals = {
    totalAmount: ord.total_amount || 0,
    discount: ord.discount_amount || 0,
    paid: ord.paid || 0,
    net: (ord.total_amount || 0) - (ord.discount_amount || 0) - (ord.paid || 0)
  };

  return {
    order_id: ord.order_id,
    user_id: ord.user_id,
    total_amount: ord.total_amount,
    status: ord.status,
    shipping_address: ord.shipping_address,
    payment_method: ord.payment_method,
    created_at: ord.created_at,
    updated_at: ord.updated_at,
    coupon_id: ord.coupon_id,
    discount_amount: ord.discount_amount,
    confirmed_by: ord.confirmed_by,
    customer_note: ord.customer_note,
    cart_note: ord.cart_note,
    currency: ord.currency || 'TRY',
    invoice_number: ord.invoice_number || `ORD-${ord.order_id}`,
    issue_date: ord.issue_date || ord.created_at,
    invoice_status: ord.invoice_status || null,
    customer: {
      user_id: ord.customer_user_id,
      full_name: ord.full_name,
      phone: ord.phone,
      email: ord.email,
      invoice_image: ord.invoice_image
    },
    items,
    totals
  };
}

async function generateItemsRows(items) {
  let rows = '';
  let idx = 1;
  for (const it of items) {
    rows += `<tr>
      <td>${idx}</td>
      <td class="rtl-left">${escapeHtml(it.product_name)}<br/><small>رمز: ${escapeHtml(it.product_code)}</small></td>
      <td>${escapeHtml(it.color_name)}</td>
      <td>${escapeHtml(it.size_value)}</td>
      <td>${it.quantity || 0}</td>
      <td>${numberWithCommas(it.price_at_purchase || 0)}</td>
      <td>${numberWithCommas(it.total || 0)}</td>
    </tr>`;
    idx++;
  }
  return rows;
}

async function generateInvoicePDF(orderId) {
  const order = await getOrderFromDB(orderId);
  const templatePath = path.join(__dirname, '../../templates/invoice_template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const logoData = await readLogoData();
  const items_rows = await generateItemsRows(order.items || []);
  const printDateTime = new Date().toLocaleString('en-GB', { hour12: false });

  const replacements = {
    '{{companyName}}': process.env.COMPANY_NAME || 'شركة شهرزاد',
    '{{contactPhone}}': process.env.COMPANY_PHONE || '',
    '{{companyAddress}}': process.env.COMPANY_ADDRESS || '',
    '{{logoData}}': logoData || '',
    '{{date}}': (new Date(order.issue_date || order.created_at)).toLocaleDateString('en-GB'),
    '{{time}}': (new Date(order.issue_date || order.created_at)).toLocaleTimeString('en-GB', { hour12: false }),
    '{{invoiceNumber}}': order.invoice_number || order.order_id,
    '{{currency}}': order.currency || 'TRY',
    '{{clientName}}': order.customer?.full_name || '',
    '{{clientAddress}}': order.shipping_address || '',
    '{{clientPhone}}': order.customer?.phone || '',
    '{{paymentMethod}}': order.payment_method || '',
    '{{shippingAddress}}': order.shipping_address || '',
    '{{items_rows}}': items_rows,
    '{{totalAmount}}': numberWithCommas(order.totals.totalAmount || 0),
    '{{discount}}': numberWithCommas(order.totals.discount || 0),
    '{{paid}}': numberWithCommas(order.totals.paid || 0),
    '{{net}}': numberWithCommas(order.totals.net || 0),
    '{{footerText}}': process.env.INVOICE_FOOTER || '',
    '{{printDateTime}}': printDateTime
  };

  for (const [key, val] of Object.entries(replacements)) {
    html = html.split(key).join(val);
  }

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  };

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '12mm', right: '12mm' }
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generateInvoicePDF };
