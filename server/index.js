require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage for export templates (in production, use a database)
const exportTemplates = {};

// In-memory storage for chat history (in production, use a database)
const chatHistory = {};

// Initialize Anthropic client (API key must be set via ANTHROPIC_API_KEY environment variable)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Helper function to parse CSV files
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
    });
    return obj;
  });
}

// Get data file path (files are in workspace root)
const getDataPath = (filename) => path.join(__dirname, '..', filename);

// Login endpoint
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const credentials = parseCSV(getDataPath('LoginCredentials.db'));
    
    const user = credentials.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (user) {
      res.json({
        success: true,
        user: {
          vendor_id: user.vendor_id,
          email: user.email,
          vendor_name: user.vendor_name
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get payments for a vendor
app.get('/api/payments/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const payments = parseCSV(getDataPath('Payments.db'));
    
    const vendorPayments = payments.filter(p => p.vendor_id === vendorId);
    res.json(vendorPayments);
  } catch (error) {
    console.error('Payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invoices for a payment
app.get('/api/invoices/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params;
    const invoices = parseCSV(getDataPath('Invoices.db'));
    
    const paymentInvoices = invoices.filter(i => i.payment_id === paymentId);
    res.json(paymentInvoices);
  } catch (error) {
    console.error('Invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all invoices for a vendor
app.get('/api/vendor-invoices/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const invoices = parseCSV(getDataPath('Invoices.db'));
    
    const vendorInvoices = invoices.filter(i => i.vendor_id === vendorId);
    res.json(vendorInvoices);
  } catch (error) {
    console.error('Vendor invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get line items for an invoice
app.get('/api/lineitems/:invoiceId', (req, res) => {
  try {
    const { invoiceId } = req.params;
    const lineItems = parseCSV(getDataPath('LineItems.db'));
    
    const invoiceLineItems = lineItems.filter(l => l.invoice_id === invoiceId);
    res.json(invoiceLineItems);
  } catch (error) {
    console.error('Line items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get virtual cards for a vendor (payments with card details)
app.get('/api/virtualcards/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const payments = parseCSV(getDataPath('Payments.db'));
    
    const virtualCards = payments.filter(
      p => p.vendor_id === vendorId && p.payment_method === 'Virtual Card' && p.card_number
    );
    res.json(virtualCards);
  } catch (error) {
    console.error('Virtual cards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard summary for a vendor
app.get('/api/dashboard/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const payments = parseCSV(getDataPath('Payments.db'));
    const invoices = parseCSV(getDataPath('Invoices.db'));
    
    const vendorPayments = payments.filter(p => p.vendor_id === vendorId);
    const vendorInvoices = invoices.filter(i => i.vendor_id === vendorId);
    
    const totalPayments = vendorPayments.length;
    const completedPayments = vendorPayments.filter(p => p.status === 'completed').length;
    const pendingPayments = vendorPayments.filter(p => p.status === 'pending').length;
    const totalAmount = vendorPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    const pendingAmount = vendorPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    const virtualCardCount = vendorPayments.filter(p => p.payment_method === 'Virtual Card').length;
    
    res.json({
      totalPayments,
      completedPayments,
      pendingPayments,
      totalAmount,
      pendingAmount,
      totalInvoices: vendorInvoices.length,
      virtualCardCount,
      recentPayments: vendorPayments.slice(0, 5)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

// Get export data (payments with invoices and line items)
app.get('/api/export-data/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const { startDate, endDate, status, paymentMethod } = req.query;
    
    const payments = parseCSV(getDataPath('Payments.db'));
    const invoices = parseCSV(getDataPath('Invoices.db'));
    const lineItems = parseCSV(getDataPath('LineItems.db'));
    
    // Filter payments
    let vendorPayments = payments.filter(p => p.vendor_id === vendorId);
    
    if (startDate) {
      vendorPayments = vendorPayments.filter(p => p.payment_date >= startDate);
    }
    if (endDate) {
      vendorPayments = vendorPayments.filter(p => p.payment_date <= endDate);
    }
    if (status && status !== 'all') {
      vendorPayments = vendorPayments.filter(p => p.status === status);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      vendorPayments = vendorPayments.filter(p => p.payment_method === paymentMethod);
    }
    
    // Enrich with invoices and line items
    const enrichedPayments = vendorPayments.map(payment => {
      const paymentInvoices = invoices.filter(i => i.payment_id === payment.payment_id);
      const enrichedInvoices = paymentInvoices.map(invoice => {
        const invoiceLineItems = lineItems.filter(l => l.invoice_id === invoice.invoice_id);
        return { ...invoice, lineItems: invoiceLineItems };
      });
      return { ...payment, invoices: enrichedInvoices };
    });
    
    res.json(enrichedPayments);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Format date based on format string
function formatDate(dateStr, format) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY': return `${day}/${month}/${year}`;
    case 'YYYYMMDD': return `${year}${month}${day}`;
    case 'MMDDYYYY': return `${month}${day}${year}`;
    default: return `${year}-${month}-${day}`;
  }
}

// Format number based on options
function formatNumber(num, decimalSep = '.', thousandsSep = '') {
  if (num === null || num === undefined) return '';
  const parts = parseFloat(num).toFixed(2).split('.');
  if (thousandsSep) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
  }
  return parts.join(decimalSep);
}

// Generate CSV/Delimited export
function generateDelimitedExport(data, options) {
  const {
    delimiter = ',',
    fields = [],
    includeHeader = true,
    dateFormat = 'YYYY-MM-DD',
    textQualifier = '',
    includeLineItems = false
  } = options;
  
  const rows = [];
  
  // Generate header
  if (includeHeader) {
    const headerRow = fields.map(f => `${textQualifier}${f.header || f.field}${textQualifier}`);
    rows.push(headerRow.join(delimiter));
  }
  
  // Generate data rows
  data.forEach(payment => {
    if (payment.invoices && payment.invoices.length > 0) {
      payment.invoices.forEach(invoice => {
        if (includeLineItems && invoice.lineItems && invoice.lineItems.length > 0) {
          invoice.lineItems.forEach(lineItem => {
            const row = fields.map(f => {
              let value = getFieldValue(payment, invoice, lineItem, f.field, dateFormat);
              return `${textQualifier}${value}${textQualifier}`;
            });
            rows.push(row.join(delimiter));
          });
        } else {
          const row = fields.map(f => {
            let value = getFieldValue(payment, invoice, null, f.field, dateFormat);
            return `${textQualifier}${value}${textQualifier}`;
          });
          rows.push(row.join(delimiter));
        }
      });
    } else {
      const row = fields.map(f => {
        let value = getFieldValue(payment, null, null, f.field, dateFormat);
        return `${textQualifier}${value}${textQualifier}`;
      });
      rows.push(row.join(delimiter));
    }
  });
  
  return rows.join('\n');
}

// Get field value from payment/invoice/lineItem
function getFieldValue(payment, invoice, lineItem, field, dateFormat) {
  const fieldMap = {
    'payment_id': payment?.payment_id || '',
    'payment_date': formatDate(payment?.payment_date, dateFormat),
    'payment_amount': payment?.total_amount || '',
    'currency': payment?.currency || '',
    'payment_method': payment?.payment_method || '',
    'payment_status': payment?.status || '',
    'card_number': payment?.card_number || '',
    'card_expiration': payment?.card_expiration || '',
    'remittance_email': payment?.remittance_email || '',
    'invoice_id': invoice?.invoice_id || '',
    'invoice_number': invoice?.invoice_number || '',
    'invoice_date': formatDate(invoice?.invoice_date, dateFormat),
    'invoice_amount': invoice?.invoice_amount || '',
    'po_number': invoice?.po_number || '',
    'invoice_description': invoice?.description || '',
    'line_item_id': lineItem?.line_item_id || '',
    'line_description': lineItem?.description || '',
    'quantity': lineItem?.quantity || '',
    'unit_price': lineItem?.unit_price || '',
    'line_total': lineItem?.line_total || '',
    'gl_code': lineItem?.gl_code || ''
  };
  
  return fieldMap[field] !== undefined ? fieldMap[field] : '';
}

// Generate BAI2 format
function generateBAI2Export(data, vendorId) {
  const lines = [];
  const today = new Date();
  const dateStr = formatDate(today.toISOString().split('T')[0], 'YYYYMMDD');
  const timeStr = today.toTimeString().slice(0, 5).replace(':', '');
  
  // File Header (01)
  lines.push(`01,CORPAY,${vendorId},${dateStr},${timeStr},001,80,1,2/`);
  
  let totalAmount = 0;
  let recordCount = 2; // Start with header
  
  data.forEach((payment, pIndex) => {
    // Group Header (02)
    lines.push(`02,${vendorId},${payment.currency},010,${Math.round(parseFloat(payment.total_amount) * 100)},,/`);
    recordCount++;
    
    // Account Identifier (03)
    lines.push(`03,${payment.payment_id},${payment.currency},010,${Math.round(parseFloat(payment.total_amount) * 100)},1,${formatDate(payment.payment_date, 'YYYYMMDD')},${timeStr},/`);
    recordCount++;
    
    // Transaction details (16)
    if (payment.invoices) {
      payment.invoices.forEach(invoice => {
        const amount = Math.round(parseFloat(invoice.invoice_amount) * 100);
        lines.push(`16,195,${amount},S,${invoice.invoice_number},${invoice.description || 'Payment'}/`);
        recordCount++;
      });
    }
    
    // Account Trailer (49)
    lines.push(`49,${Math.round(parseFloat(payment.total_amount) * 100)},${payment.invoices?.length || 1}/`);
    recordCount++;
    
    totalAmount += parseFloat(payment.total_amount);
  });
  
  // Group Trailer (98)
  lines.push(`98,${Math.round(totalAmount * 100)},${data.length},${recordCount}/`);
  recordCount++;
  
  // File Trailer (99)
  lines.push(`99,${Math.round(totalAmount * 100)},1,${recordCount + 1}/`);
  
  return lines.join('\n');
}

// Generate MT940 format
function generateMT940Export(data, vendorId) {
  const lines = [];
  const today = new Date();
  const dateStr = formatDate(today.toISOString().split('T')[0], 'YYYYMMDD').slice(2); // YYMMDD
  
  data.forEach(payment => {
    // Transaction Reference Number
    lines.push(`:20:${payment.payment_id}`);
    // Account Identification
    lines.push(`:25:${vendorId}`);
    // Statement Number
    lines.push(`:28C:1/1`);
    // Opening Balance
    lines.push(`:60F:C${dateStr}${payment.currency}${formatNumber(payment.total_amount, ',', '')}`);
    
    // Transaction details
    if (payment.invoices) {
      payment.invoices.forEach(invoice => {
        const invDateStr = formatDate(invoice.invoice_date, 'YYYYMMDD').slice(2);
        lines.push(`:61:${invDateStr}${invDateStr}C${formatNumber(invoice.invoice_amount, ',', '')}NTRF${invoice.invoice_number}`);
        lines.push(`:86:${invoice.description || 'Payment for invoice'}`);
      });
    }
    
    // Closing Balance
    lines.push(`:62F:C${dateStr}${payment.currency}${formatNumber(payment.total_amount, ',', '')}`);
    lines.push('-');
  });
  
  return lines.join('\n');
}

// Generate camt.053 XML format
function generateCamt053Export(data, vendorId) {
  const today = new Date().toISOString();
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>MSG-${Date.now()}</MsgId>
      <CreDtTm>${today}</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-${vendorId}-${Date.now()}</Id>
      <CreDtTm>${today}</CreDtTm>
      <Acct>
        <Id><Othr><Id>${vendorId}</Id></Othr></Id>
      </Acct>`;
  
  data.forEach(payment => {
    xml += `
      <Ntry>
        <Amt Ccy="${payment.currency}">${payment.total_amount}</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts><Cd>BOOK</Cd></Sts>
        <BookgDt><Dt>${payment.payment_date}</Dt></BookgDt>
        <AcctSvcrRef>${payment.payment_id}</AcctSvcrRef>
        <BkTxCd><Domn><Cd>PMNT</Cd></Domn></BkTxCd>
        <NtryDtls>`;
    
    if (payment.invoices) {
      payment.invoices.forEach(invoice => {
        xml += `
          <TxDtls>
            <Refs><EndToEndId>${invoice.invoice_number}</EndToEndId></Refs>
            <Amt Ccy="${payment.currency}">${invoice.invoice_amount}</Amt>
            <RmtInf><Ustrd>${invoice.description || ''}</Ustrd></RmtInf>
          </TxDtls>`;
      });
    }
    
    xml += `
        </NtryDtls>
      </Ntry>`;
  });
  
  xml += `
    </Stmt>
  </BkToCstmrStmt>
</Document>`;
  
  return xml;
}

// Generate OFX format
function generateOFXExport(data, vendorId) {
  const today = new Date();
  const dateStr = today.toISOString().replace(/[-:]/g, '').split('.')[0];
  
  let ofx = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
<DTSERVER>${dateStr}
<LANGUAGE>ENG
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>${Date.now()}
<STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS>
<STMTRS>
<CURDEF>USD
<BANKACCTFROM>
<BANKID>CORPAY
<ACCTID>${vendorId}
<ACCTTYPE>CHECKING
</BANKACCTFROM>
<BANKTRANLIST>`;

  data.forEach(payment => {
    if (payment.invoices) {
      payment.invoices.forEach(invoice => {
        const invDateStr = invoice.invoice_date.replace(/-/g, '') + '000000';
        ofx += `
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>${invDateStr}
<TRNAMT>${invoice.invoice_amount}
<FITID>${payment.payment_id}-${invoice.invoice_id}
<NAME>${invoice.invoice_number}
<MEMO>${invoice.description || 'Payment'}
</STMTTRN>`;
      });
    }
  });

  ofx += `
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  return ofx;
}

// Generate QBO format (QuickBooks)
function generateQBOExport(data, vendorId) {
  // QBO is essentially OFX with QuickBooks-specific elements
  return generateOFXExport(data, vendorId);
}

// Export endpoint - generates file in requested format
app.post('/api/export/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const { format, options = {}, filters = {} } = req.body;
    
    // Get filtered data
    const payments = parseCSV(getDataPath('Payments.db'));
    const invoices = parseCSV(getDataPath('Invoices.db'));
    const lineItems = parseCSV(getDataPath('LineItems.db'));
    
    let vendorPayments = payments.filter(p => p.vendor_id === vendorId);
    
    // Apply filters
    if (filters.startDate) {
      vendorPayments = vendorPayments.filter(p => p.payment_date >= filters.startDate);
    }
    if (filters.endDate) {
      vendorPayments = vendorPayments.filter(p => p.payment_date <= filters.endDate);
    }
    if (filters.status && filters.status !== 'all') {
      vendorPayments = vendorPayments.filter(p => p.status === filters.status);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      vendorPayments = vendorPayments.filter(p => p.payment_method === filters.paymentMethod);
    }
    
    // Enrich with invoices and line items
    const enrichedPayments = vendorPayments.map(payment => {
      const paymentInvoices = invoices.filter(i => i.payment_id === payment.payment_id);
      const enrichedInvoices = paymentInvoices.map(invoice => {
        const invoiceLineItems = lineItems.filter(l => l.invoice_id === invoice.invoice_id);
        return { ...invoice, lineItems: invoiceLineItems };
      });
      return { ...payment, invoices: enrichedInvoices };
    });
    
    let content = '';
    let filename = '';
    let contentType = '';
    
    switch (format) {
      case 'csv':
      case 'custom':
        content = generateDelimitedExport(enrichedPayments, options);
        filename = `payment_export_${vendorId}_${Date.now()}.csv`;
        contentType = 'text/csv';
        break;
        
      case 'tsv':
        content = generateDelimitedExport(enrichedPayments, { ...options, delimiter: '\t' });
        filename = `payment_export_${vendorId}_${Date.now()}.tsv`;
        contentType = 'text/tab-separated-values';
        break;
        
      case 'bai2':
        content = generateBAI2Export(enrichedPayments, vendorId);
        filename = `payment_export_${vendorId}_${Date.now()}.bai2`;
        contentType = 'text/plain';
        break;
        
      case 'mt940':
        content = generateMT940Export(enrichedPayments, vendorId);
        filename = `payment_export_${vendorId}_${Date.now()}.mt940`;
        contentType = 'text/plain';
        break;
        
      case 'camt053':
        content = generateCamt053Export(enrichedPayments, vendorId);
        filename = `payment_export_${vendorId}_${Date.now()}.xml`;
        contentType = 'application/xml';
        break;
        
      case 'ofx':
        content = generateOFXExport(enrichedPayments, vendorId);
        filename = `payment_export_${vendorId}_${Date.now()}.ofx`;
        contentType = 'application/x-ofx';
        break;
        
      case 'qbo':
        content = generateQBOExport(enrichedPayments, vendorId);
        filename = `payment_export_${vendorId}_${Date.now()}.qbo`;
        contentType = 'application/vnd.intu.qbo';
        break;
        
      default:
        return res.status(400).json({ message: 'Unsupported export format' });
    }
    
    res.json({ content, filename, contentType });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save export template
app.post('/api/templates/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    const { name, description, config } = req.body;
    
    if (!exportTemplates[vendorId]) {
      exportTemplates[vendorId] = [];
    }
    
    const template = {
      id: Date.now().toString(),
      name,
      description,
      config,
      createdAt: new Date().toISOString()
    };
    
    exportTemplates[vendorId].push(template);
    res.json(template);
  } catch (error) {
    console.error('Save template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get export templates
app.get('/api/templates/:vendorId', (req, res) => {
  try {
    const { vendorId } = req.params;
    res.json(exportTemplates[vendorId] || []);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete export template
app.delete('/api/templates/:vendorId/:templateId', (req, res) => {
  try {
    const { vendorId, templateId } = req.params;
    
    if (exportTemplates[vendorId]) {
      exportTemplates[vendorId] = exportTemplates[vendorId].filter(t => t.id !== templateId);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Available fields for export
app.get('/api/export-fields', (req, res) => {
  res.json([
    { field: 'payment_id', label: 'Payment ID', category: 'Payment' },
    { field: 'payment_date', label: 'Payment Date', category: 'Payment' },
    { field: 'payment_amount', label: 'Payment Amount', category: 'Payment' },
    { field: 'currency', label: 'Currency', category: 'Payment' },
    { field: 'payment_method', label: 'Payment Method', category: 'Payment' },
    { field: 'payment_status', label: 'Payment Status', category: 'Payment' },
    { field: 'card_number', label: 'Card Number', category: 'Payment' },
    { field: 'card_expiration', label: 'Card Expiration', category: 'Payment' },
    { field: 'remittance_email', label: 'Remittance Email', category: 'Payment' },
    { field: 'invoice_id', label: 'Invoice ID', category: 'Invoice' },
    { field: 'invoice_number', label: 'Invoice Number', category: 'Invoice' },
    { field: 'invoice_date', label: 'Invoice Date', category: 'Invoice' },
    { field: 'invoice_amount', label: 'Invoice Amount', category: 'Invoice' },
    { field: 'po_number', label: 'PO Number', category: 'Invoice' },
    { field: 'invoice_description', label: 'Invoice Description', category: 'Invoice' },
    { field: 'line_item_id', label: 'Line Item ID', category: 'Line Item' },
    { field: 'line_description', label: 'Line Description', category: 'Line Item' },
    { field: 'quantity', label: 'Quantity', category: 'Line Item' },
    { field: 'unit_price', label: 'Unit Price', category: 'Line Item' },
    { field: 'line_total', label: 'Line Total', category: 'Line Item' },
    { field: 'gl_code', label: 'GL Code', category: 'Line Item' }
  ]);
});

// ============================================
// AI CHAT SUPPORT
// ============================================

// Build context from vendor's payment data
function buildPaymentContext(vendorId) {
  const payments = parseCSV(getDataPath('Payments.db'));
  const invoices = parseCSV(getDataPath('Invoices.db'));
  const lineItems = parseCSV(getDataPath('LineItems.db'));
  const credentials = parseCSV(getDataPath('LoginCredentials.db'));
  
  const vendor = credentials.find(c => c.vendor_id === vendorId);
  const vendorPayments = payments.filter(p => p.vendor_id === vendorId);
  const vendorInvoices = invoices.filter(i => i.vendor_id === vendorId);
  
  // Enrich payments with invoice details
  const enrichedPayments = vendorPayments.map(payment => {
    const paymentInvoices = vendorInvoices.filter(i => i.payment_id === payment.payment_id);
    const enrichedInvoices = paymentInvoices.map(invoice => {
      const invoiceLineItems = lineItems.filter(l => l.invoice_id === invoice.invoice_id);
      return {
        invoice_id: invoice.invoice_id,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        invoice_amount: invoice.invoice_amount,
        po_number: invoice.po_number,
        description: invoice.description,
        line_items: invoiceLineItems.map(li => ({
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          line_total: li.line_total,
          gl_code: li.gl_code
        }))
      };
    });
    
    return {
      payment_id: payment.payment_id,
      payment_date: payment.payment_date,
      total_amount: payment.total_amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      status: payment.status,
      card_last_four: payment.card_number ? payment.card_number.slice(-4) : null,
      invoices: enrichedInvoices
    };
  });
  
  // Calculate summary stats
  const totalReceived = vendorPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  const pendingAmount = vendorPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
  
  return {
    vendor_name: vendor?.vendor_name || 'Unknown Vendor',
    vendor_email: vendor?.email || '',
    summary: {
      total_payments: vendorPayments.length,
      completed_payments: vendorPayments.filter(p => p.status === 'completed').length,
      pending_payments: vendorPayments.filter(p => p.status === 'pending').length,
      total_received: totalReceived.toFixed(2),
      pending_amount: pendingAmount.toFixed(2),
      total_invoices: vendorInvoices.length
    },
    payments: enrichedPayments
  };
}

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful payment support assistant for the Corpay Vendor Portal. You help vendors understand their payment history, invoice status, and answer questions about their account.

Your personality:
- Professional but friendly
- Concise but thorough
- Always reference specific data (payment IDs, dates, amounts) when answering
- Use proper currency formatting (e.g., $5,000.00)
- Use clear date formatting (e.g., December 15, 2025)

Guidelines:
1. When asked about a specific invoice, search through the payments to find it and provide complete details
2. When asked about payment status, be specific about whether it's completed, pending, or processing
3. For questions you cannot answer from the data, politely explain and suggest contacting support@corpay.com
4. For payment method changes, direct them to contact support@corpay.com or their account manager
5. Never reveal full card numbers - only reference the last 4 digits
6. If the vendor has no data matching their query, let them know clearly

You have access to the vendor's complete payment data which will be provided in each message.`;

// Chat endpoint
app.post('/api/chat/:vendorId', async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { message, conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Build context from vendor's data
    const context = buildPaymentContext(vendorId);
    
    // Initialize or get conversation history
    const convId = conversationId || `${vendorId}-${Date.now()}`;
    if (!chatHistory[convId]) {
      chatHistory[convId] = [];
    }
    
    // Add user message to history
    chatHistory[convId].push({
      role: 'user',
      content: message
    });
    
    // Keep only last 10 messages for context
    const recentHistory = chatHistory[convId].slice(-10);
    
    // Build the user message with context
    const contextMessage = `
VENDOR CONTEXT:
- Vendor Name: ${context.vendor_name}
- Email: ${context.vendor_email}

PAYMENT SUMMARY:
- Total Payments: ${context.summary.total_payments}
- Completed: ${context.summary.completed_payments}
- Pending: ${context.summary.pending_payments}
- Total Received: $${context.summary.total_received}
- Pending Amount: $${context.summary.pending_amount}
- Total Invoices: ${context.summary.total_invoices}

PAYMENT DATA:
${JSON.stringify(context.payments, null, 2)}

USER QUESTION: ${message}`;

    // Prepare messages for Claude
    const messages = recentHistory.slice(0, -1).concat([
      { role: 'user', content: contextMessage }
    ]);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
    });
    
    const assistantMessage = response.content[0].text;
    
    // Add assistant response to history
    chatHistory[convId].push({
      role: 'assistant',
      content: assistantMessage
    });
    
    res.json({
      conversationId: convId,
      message: assistantMessage
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Get chat history
app.get('/api/chat/:vendorId/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  res.json(chatHistory[conversationId] || []);
});

// Clear chat history
app.delete('/api/chat/:vendorId/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  delete chatHistory[conversationId];
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
