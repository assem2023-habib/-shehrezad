/**
 * Invoice Controller - متحكم الفواتير
 */

const invoiceService = require('../services/invoice_service');
const response = require('../../../../config/response_helper');

/**
 * توليد وتحميل فاتورة PDF
 * GET /api/dashboard/orders/:id/invoice
 */
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pdfBuffer = await invoiceService.generateInvoicePDF(parseInt(id));

    // تعيين headers للتحميل
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Generate Invoice Error:', error);
    return response.badRequest(res, error.message || 'حدث خطأ أثناء توليد الفاتورة');
  }
};

/**
 * عرض فاتورة PDF في المتصفح
 * GET /api/dashboard/orders/:id/invoice/view
 */
const viewInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const pdfBuffer = await invoiceService.generateInvoicePDF(parseInt(id));

    // تعيين headers للعرض في المتصفح
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('View Invoice Error:', error);
    return response.badRequest(res, error.message || 'حدث خطأ أثناء عرض الفاتورة');
  }
};

module.exports = {
  generateInvoice,
  viewInvoice
};
