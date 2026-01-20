const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
