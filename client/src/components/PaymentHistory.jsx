import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function PaymentHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchPayments()
  }, [user])

  const fetchPayments = async () => {
    try {
      const response = await fetch(`/api/payments/${user.vendor_id}`)
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
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
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true
    return payment.status === filter
  })

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.total_amount || 0), 
    0
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading payments...
      </div>
    )
  }

  return (
    <div>
      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Payments</div>
          <div className="stat-value">{filteredPayments.length}</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Amount</div>
          <div className="stat-value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">
            {payments.filter(p => p.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Payment List */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Payment History</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button 
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr 
                    key={payment.payment_id}
                    className="clickable-row"
                    onClick={() => navigate(`/payments/${payment.payment_id}`)}
                  >
                    <td style={{ fontWeight: 500 }}>#{payment.payment_id}</td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td className="money" style={{ fontWeight: 600 }}>
                      {formatCurrency(parseFloat(payment.total_amount))}
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px' 
                      }}>
                        {payment.payment_method === 'Virtual Card' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        )}
                        {payment.payment_method}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${payment.status}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280', padding: '48px' }}>
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentHistory
