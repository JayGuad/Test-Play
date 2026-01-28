import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function PaymentDetail() {
  const { paymentId } = useParams()
  const { user } = useAuth()
  const [payment, setPayment] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [lineItems, setLineItems] = useState({})
  const [expandedInvoice, setExpandedInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCardDetails, setShowCardDetails] = useState(false)

  useEffect(() => {
    fetchPaymentDetails()
  }, [paymentId])

  const fetchPaymentDetails = async () => {
    try {
      // Fetch payment
      const paymentsRes = await fetch(`/api/payments/${user.vendor_id}`)
      const payments = await paymentsRes.json()
      const foundPayment = payments.find(p => p.payment_id === paymentId)
      setPayment(foundPayment)

      // Fetch invoices for this payment
      const invoicesRes = await fetch(`/api/invoices/${paymentId}`)
      const invoicesData = await invoicesRes.json()
      setInvoices(invoicesData)
    } catch (error) {
      console.error('Error fetching payment details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLineItems = async (invoiceId) => {
    if (lineItems[invoiceId]) {
      setExpandedInvoice(expandedInvoice === invoiceId ? null : invoiceId)
      return
    }

    try {
      const response = await fetch(`/api/lineitems/${invoiceId}`)
      const data = await response.json()
      setLineItems(prev => ({ ...prev, [invoiceId]: data }))
      setExpandedInvoice(invoiceId)
    } catch (error) {
      console.error('Error fetching line items:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const maskCardNumber = (cardNumber) => {
    if (!cardNumber) return ''
    if (showCardDetails) return cardNumber.replace(/(.{4})/g, '$1 ').trim()
    return `**** **** **** ${cardNumber.slice(-4)}`
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading payment details...
      </div>
    )
  }

  if (!payment) {
    return (
      <div>
        <Link to="/payments" className="back-link">
          ← Back to Payments
        </Link>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '48px' }}>
            Payment not found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/payments" className="back-link">
        ← Back to Payments
      </Link>

      {/* Payment Summary */}
      <div className="card section">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Payment #{payment.payment_id}</h2>
          <span className={`status-badge ${payment.status}`}>
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Payment Date</span>
              <span className="detail-value">{formatDate(payment.payment_date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value money" style={{ fontSize: '24px', color: '#10b981' }}>
                {formatCurrency(parseFloat(payment.total_amount))}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{payment.payment_method}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Currency</span>
              <span className="detail-value">{payment.currency}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Remittance Email</span>
              <span className="detail-value">{payment.remittance_email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Invoices Included</span>
              <span className="detail-value">{invoices.length}</span>
            </div>
          </div>

          {/* Virtual Card Details */}
          {payment.payment_method === 'Virtual Card' && payment.card_number && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#f5f7fa', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#1a1f3d' }}>
                Virtual Card Details
              </h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Card Number</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {maskCardNumber(payment.card_number)}
                    <button 
                      className="reveal-btn" 
                      style={{ 
                        background: '#e1e5eb', 
                        color: '#333',
                        marginLeft: '12px' 
                      }}
                      onClick={() => setShowCardDetails(!showCardDetails)}
                    >
                      {showCardDetails ? 'Hide' : 'Reveal'}
                    </button>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Expiration</span>
                  <span className="detail-value">{payment.card_expiration}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">CVV</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace' }}>
                    {showCardDetails ? payment.card_cvv : '***'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Invoices ({invoices.length})</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {invoices.map((invoice) => (
            <div key={invoice.invoice_id}>
              <div 
                style={{ 
                  padding: '20px 24px', 
                  borderBottom: '1px solid #e1e5eb',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                className="clickable-row"
                onClick={() => fetchLineItems(invoice.invoice_id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {invoice.invoice_number}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {invoice.description}
                    </div>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                      PO: {invoice.po_number} • Date: {formatDate(invoice.invoice_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="money" style={{ fontSize: '18px', fontWeight: '600' }}>
                      {formatCurrency(parseFloat(invoice.invoice_amount))}
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span
                        className={`invoice-caret ${
                          expandedInvoice === invoice.invoice_id ? 'expanded' : ''
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {expandedInvoice === invoice.invoice_id ? 'Hide Items' : 'View Items'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {expandedInvoice === invoice.invoice_id && lineItems[invoice.invoice_id] && (
                <div style={{ background: '#f9fafb', padding: '16px 24px 16px 48px' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', fontSize: '11px' }}>Description</th>
                        <th style={{ padding: '8px', fontSize: '11px', textAlign: 'right' }}>Qty</th>
                        <th style={{ padding: '8px', fontSize: '11px', textAlign: 'right' }}>Unit Price</th>
                        <th style={{ padding: '8px', fontSize: '11px', textAlign: 'right' }}>Total</th>
                        <th style={{ padding: '8px', fontSize: '11px' }}>GL Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems[invoice.invoice_id].map((item) => (
                        <tr key={item.line_item_id} style={{ background: 'white' }}>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #e1e5eb' }}>
                            {item.description}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #e1e5eb', textAlign: 'right' }}>
                            {item.quantity}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #e1e5eb', textAlign: 'right' }}>
                            {formatCurrency(parseFloat(item.unit_price))}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #e1e5eb', textAlign: 'right', fontWeight: '500' }}>
                            {formatCurrency(parseFloat(item.line_total))}
                          </td>
                          <td style={{ padding: '12px 8px', borderBottom: '1px solid #e1e5eb', fontFamily: 'monospace', fontSize: '13px' }}>
                            {item.gl_code}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
          
          {invoices.length === 0 && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
              No invoices found for this payment
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentDetail
