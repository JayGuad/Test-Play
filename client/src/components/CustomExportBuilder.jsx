import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const DELIMITERS = [
  { id: 'comma', label: 'Comma (,)', value: ',' },
  { id: 'tab', label: 'Tab', value: '\t' },
  { id: 'pipe', label: 'Pipe (|)', value: '|' },
  { id: 'semicolon', label: 'Semicolon (;)', value: ';' }
]

const DATE_FORMATS = [
  { id: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
  { id: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
  { id: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
  { id: 'YYYYMMDD', label: 'YYYYMMDD (20251231)' },
  { id: 'MMDDYYYY', label: 'MMDDYYYY (12312025)' }
]

const TEXT_QUALIFIERS = [
  { id: 'none', label: 'None', value: '' },
  { id: 'double', label: 'Double Quotes (")', value: '"' },
  { id: 'single', label: "Single Quotes (')", value: "'" }
]

function CustomExportBuilder({ onBack, onExport, filters, onTemplatesSaved }) {
  const { user } = useAuth()
  const [availableFields, setAvailableFields] = useState([])
  const [selectedFields, setSelectedFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  
  // Export options
  const [options, setOptions] = useState({
    delimiter: ',',
    dateFormat: 'YYYY-MM-DD',
    textQualifier: '',
    includeHeader: true,
    includeLineItems: false
  })

  useEffect(() => {
    fetchAvailableFields()
  }, [])

  const fetchAvailableFields = async () => {
    try {
      const response = await fetch('/api/export-fields')
      const fields = await response.json()
      setAvailableFields(fields)
      
      // Set default selected fields
      const defaultFields = fields
        .filter(f => ['payment_id', 'payment_date', 'payment_amount', 'currency', 'invoice_number', 'invoice_amount'].includes(f.field))
        .map(f => ({ ...f, header: f.label }))
      setSelectedFields(defaultFields)
    } catch (error) {
      console.error('Error fetching fields:', error)
    }
  }

  const addField = (field) => {
    if (!selectedFields.find(f => f.field === field.field)) {
      setSelectedFields([...selectedFields, { ...field, header: field.label }])
    }
  }

  const removeField = (fieldId) => {
    setSelectedFields(selectedFields.filter(f => f.field !== fieldId))
  }

  const moveField = (index, direction) => {
    const newFields = [...selectedFields]
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= newFields.length) return
    
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]]
    setSelectedFields(newFields)
  }

  const updateFieldHeader = (index, header) => {
    const newFields = [...selectedFields]
    newFields[index] = { ...newFields[index], header }
    setSelectedFields(newFields)
  }

  const getConfig = () => ({
    delimiter: options.delimiter,
    fields: selectedFields,
    includeHeader: options.includeHeader,
    dateFormat: options.dateFormat,
    textQualifier: options.textQualifier,
    includeLineItems: options.includeLineItems
  })

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/export/${user.vendor_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'custom',
          options: getConfig(),
          filters
        })
      })
      
      const data = await response.json()
      setPreview(data.content)
    } catch (error) {
      console.error('Preview error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    onExport('custom', getConfig())
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const response = await fetch(`/api/templates/${user.vendor_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          config: getConfig()
        })
      })

      if (response.ok) {
        alert('Template saved successfully!')
        setShowSaveTemplate(false)
        setTemplateName('')
        setTemplateDescription('')
        onTemplatesSaved?.()
      }
    } catch (error) {
      console.error('Save template error:', error)
      alert('Failed to save template')
    }
  }

  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = []
    acc[field.category].push(field)
    return acc
  }, {})

  return (
    <div>
      <button className="back-link" onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Back to Export Options
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column - Available Fields */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Available Fields</h2>
          </div>
          <div className="card-body" style={{ maxHeight: '500px', overflow: 'auto' }}>
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  fontSize: '12px', 
                  textTransform: 'uppercase', 
                  color: '#6b7280',
                  marginBottom: '8px',
                  fontWeight: '600'
                }}>
                  {category}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {fields.map((field) => {
                    const isSelected = selectedFields.find(f => f.field === field.field)
                    return (
                      <button
                        key={field.field}
                        onClick={() => addField(field)}
                        disabled={isSelected}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid',
                          borderColor: isSelected ? '#d1d5db' : 'var(--corpay-blue)',
                          background: isSelected ? '#f3f4f6' : 'white',
                          color: isSelected ? '#9ca3af' : 'var(--corpay-blue)',
                          cursor: isSelected ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                      >
                        + {field.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Selected Fields & Options */}
        <div>
          {/* Selected Fields */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h2 className="card-title">Selected Fields ({selectedFields.length})</h2>
            </div>
            <div className="card-body" style={{ padding: selectedFields.length ? '12px' : '24px' }}>
              {selectedFields.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center' }}>
                  Click fields on the left to add them to your export
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedFields.map((field, index) => (
                    <div 
                      key={field.field}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <button 
                          onClick={() => moveField(index, -1)}
                          disabled={index === 0}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            opacity: index === 0 ? 0.3 : 1,
                            padding: '0',
                            lineHeight: '1'
                          }}
                        >
                          ▲
                        </button>
                        <button 
                          onClick={() => moveField(index, 1)}
                          disabled={index === selectedFields.length - 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: index === selectedFields.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: index === selectedFields.length - 1 ? 0.3 : 1,
                            padding: '0',
                            lineHeight: '1'
                          }}
                        >
                          ▼
                        </button>
                      </div>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        background: 'var(--corpay-blue)',
                        color: 'white',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {index + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{field.label}</div>
                        <input
                          type="text"
                          value={field.header}
                          onChange={(e) => updateFieldHeader(index, e.target.value)}
                          placeholder="Column Header"
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '13px',
                            marginTop: '4px'
                          }}
                        />
                      </div>
                      <button
                        onClick={() => removeField(field.field)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '4px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Export Options */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Export Options</h2>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Delimiter</label>
                  <select
                    className="form-input"
                    value={options.delimiter}
                    onChange={(e) => setOptions({ ...options, delimiter: e.target.value })}
                  >
                    {DELIMITERS.map(d => (
                      <option key={d.id} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date Format</label>
                  <select
                    className="form-input"
                    value={options.dateFormat}
                    onChange={(e) => setOptions({ ...options, dateFormat: e.target.value })}
                  >
                    {DATE_FORMATS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Text Qualifier</label>
                  <select
                    className="form-input"
                    value={options.textQualifier}
                    onChange={(e) => setOptions({ ...options, textQualifier: e.target.value })}
                  >
                    {TEXT_QUALIFIERS.map(t => (
                      <option key={t.id} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">&nbsp;</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={options.includeHeader}
                        onChange={(e) => setOptions({ ...options, includeHeader: e.target.checked })}
                      />
                      <span style={{ fontSize: '14px' }}>Include Header Row</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={options.includeLineItems}
                        onChange={(e) => setOptions({ ...options, includeLineItems: e.target.checked })}
                      />
                      <span style={{ fontSize: '14px' }}>Include Line Items</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '24px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid var(--medium-gray)'
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSaveTemplate(true)}
          disabled={selectedFields.length === 0}
        >
          Save as Template
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={handlePreview}
            disabled={loading || selectedFields.length === 0}
          >
            {loading ? 'Loading...' : 'Preview'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={selectedFields.length === 0}
          >
            Download Export
          </button>
        </div>
      </div>

      {/* Preview Panel */}
      {preview && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">Preview</h2>
            <button className="btn btn-secondary" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
          <div className="card-body">
            <pre style={{
              background: '#1a1f3d',
              color: '#00d4d4',
              padding: '20px',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '300px',
              fontSize: '12px',
              lineHeight: '1.5'
            }}>
              {preview.slice(0, 2000)}
              {preview.length > 2000 && '\n\n... (truncated)'}
            </pre>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>
              Save Export Template
            </h2>
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input
                type="text"
                className="form-input"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., SAP Import Format"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (optional)</label>
              <textarea
                className="form-input"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSaveTemplate(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveTemplate}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomExportBuilder
