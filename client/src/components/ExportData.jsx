import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import CustomExportBuilder from './CustomExportBuilder'

const STANDARD_FORMATS = [
  { 
    id: 'csv', 
    name: 'CSV (Standard)', 
    description: 'Comma-separated values - Universal format',
    icon: '📊',
    erps: 'All ERPs'
  },
  { 
    id: 'bai2', 
    name: 'BAI2', 
    description: 'Bank Administration Institute format',
    icon: '🏦',
    erps: 'SAP, Oracle, Dynamics, NetSuite'
  },
  { 
    id: 'mt940', 
    name: 'MT940 (SWIFT)', 
    description: 'International bank statement format',
    icon: '🌍',
    erps: 'SAP, Oracle, Sage, European ERPs'
  },
  { 
    id: 'camt053', 
    name: 'camt.053 (ISO 20022)', 
    description: 'Modern XML-based international standard',
    icon: '📄',
    erps: 'SAP S/4HANA, Oracle Cloud'
  },
  { 
    id: 'ofx', 
    name: 'OFX', 
    description: 'Open Financial Exchange format',
    icon: '💼',
    erps: 'QuickBooks, Quicken, Sage 50'
  },
  { 
    id: 'qbo', 
    name: 'QBO (QuickBooks)', 
    description: 'QuickBooks Online/Desktop format',
    icon: '📗',
    erps: 'QuickBooks Online, QuickBooks Desktop'
  }
]

function ExportData() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [payments, setPayments] = useState([])
  const [templates, setTemplates] = useState([])
  const [showCustomBuilder, setShowCustomBuilder] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState(null)
  const [preview, setPreview] = useState(null)
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    paymentMethod: 'all'
  })

  useEffect(() => {
    fetchPayments()
    fetchTemplates()
  }, [user, filters])

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.paymentMethod !== 'all') params.append('paymentMethod', filters.paymentMethod)
      
      const response = await fetch(`/api/export-data/${user.vendor_id}?${params}`)
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/templates/${user.vendor_id}`)
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleExport = async (format, options = {}) => {
    setLoading(true)
    try {
      // Default fields for standard CSV export
      const defaultFields = [
        { field: 'payment_id', header: 'Payment ID' },
        { field: 'payment_date', header: 'Payment Date' },
        { field: 'payment_amount', header: 'Amount' },
        { field: 'currency', header: 'Currency' },
        { field: 'payment_method', header: 'Method' },
        { field: 'payment_status', header: 'Status' },
        { field: 'invoice_number', header: 'Invoice Number' },
        { field: 'invoice_amount', header: 'Invoice Amount' },
        { field: 'po_number', header: 'PO Number' }
      ]

      const exportOptions = format === 'csv' ? {
        delimiter: ',',
        fields: defaultFields,
        includeHeader: true,
        dateFormat: 'YYYY-MM-DD',
        textQualifier: '',
        includeLineItems: false,
        ...options
      } : options

      const response = await fetch(`/api/export/${user.vendor_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          options: exportOptions,
          filters
        })
      })

      const data = await response.json()
      
      // Download file
      const blob = new Blob([data.content], { type: data.contentType })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (format, options = {}) => {
    try {
      const defaultFields = [
        { field: 'payment_id', header: 'Payment ID' },
        { field: 'payment_date', header: 'Payment Date' },
        { field: 'payment_amount', header: 'Amount' },
        { field: 'currency', header: 'Currency' },
        { field: 'payment_method', header: 'Method' },
        { field: 'invoice_number', header: 'Invoice Number' },
        { field: 'invoice_amount', header: 'Invoice Amount' }
      ]

      const exportOptions = format === 'csv' ? {
        delimiter: ',',
        fields: defaultFields,
        includeHeader: true,
        dateFormat: 'YYYY-MM-DD',
        ...options
      } : options

      const response = await fetch(`/api/export/${user.vendor_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          options: exportOptions,
          filters
        })
      })

      const data = await response.json()
      setPreview({ format, content: data.content })
      setSelectedFormat(format)
    } catch (error) {
      console.error('Preview error:', error)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template?')) return
    
    try {
      await fetch(`/api/templates/${user.vendor_id}/${templateId}`, {
        method: 'DELETE'
      })
      fetchTemplates()
    } catch (error) {
      console.error('Delete template error:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0)
  const totalInvoices = payments.reduce((sum, p) => sum + (p.invoices?.length || 0), 0)

  if (showCustomBuilder) {
    return (
      <CustomExportBuilder 
        onBack={() => setShowCustomBuilder(false)}
        onExport={handleExport}
        filters={filters}
        onTemplatesSaved={fetchTemplates}
      />
    )
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Payments Selected</div>
          <div className="stat-value">{payments.length}</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Amount</div>
          <div className="stat-value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{totalInvoices}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card section">
        <div className="card-header">
          <h2 className="card-title">Filter Data</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Payment Method</label>
              <select
                className="form-input"
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
              >
                <option value="all">All Methods</option>
                <option value="ACH">ACH</option>
                <option value="Wire">Wire</option>
                <option value="Virtual Card">Virtual Card</option>
                <option value="Check">Check</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Formats */}
      <div className="card section">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Quick Export - Standard Formats</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCustomBuilder(true)}
          >
            Custom Export Builder
          </button>
        </div>
        <div className="card-body">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '16px' 
          }}>
            {STANDARD_FORMATS.map((format) => (
              <div 
                key={format.id}
                className="format-card"
                style={{
                  border: selectedFormat === format.id ? '2px solid var(--corpay-blue)' : '1px solid var(--medium-gray)',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedFormat === format.id ? 'rgba(0, 102, 204, 0.05)' : 'white'
                }}
                onClick={() => handlePreview(format.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px' }}>{format.icon}</span>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{format.name}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  {format.description}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                  <strong>Compatible:</strong> {format.erps}
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExport(format.id)
                    }}
                    disabled={loading || payments.length === 0}
                  >
                    {loading ? 'Exporting...' : 'Download'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(format.id)
                    }}
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Saved Templates */}
      {templates.length > 0 && (
        <div className="card section">
          <div className="card-header">
            <h2 className="card-title">Saved Templates</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Template Name</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.id}>
                    <td style={{ fontWeight: 500 }}>{template.name}</td>
                    <td style={{ color: '#6b7280' }}>{template.description || '-'}</td>
                    <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleExport('custom', template.config)}
                          disabled={loading || payments.length === 0}
                        >
                          Export
                        </button>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">
              Preview: {STANDARD_FORMATS.find(f => f.id === preview.format)?.name || preview.format.toUpperCase()}
            </h2>
            <button 
              className="btn btn-secondary"
              onClick={() => setPreview(null)}
            >
              Close Preview
            </button>
          </div>
          <div className="card-body">
            <pre style={{
              background: '#1a1f3d',
              color: '#00d4d4',
              padding: '20px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '400px',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              {preview.content.slice(0, 3000)}
              {preview.content.length > 3000 && '\n\n... (truncated)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportData
