import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [user])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/dashboard/${user.vendor_id}`)
      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Received</div>
          <div className="stat-value">{formatCurrency(data?.totalAmount || 0)}</div>
          <div className="stat-subtitle">{data?.completedPayments || 0} completed payments</div>
        </div>
        
        <div className="stat-card teal">
          <div className="stat-label">Pending Payments</div>
          <div className="stat-value">{formatCurrency(data?.pendingAmount || 0)}</div>
          <div className="stat-subtitle">{data?.pendingPayments || 0} payments pending</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Invoices</div>
          <div className="stat-value">{data?.totalInvoices || 0}</div>
          <div className="stat-subtitle">Across all payments</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Virtual Cards</div>
          <div className="stat-value">{data?.virtualCardCount || 0}</div>
          <div className="stat-subtitle">Card payments received</div>
        </div>
      </div>

      {/* Invoice Aging */}
      <div className="card section">
        <div className="card-header">
          <h2 className="card-title">Payment Summary</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: '#6b7280' }}>All Payments</span>
            <span style={{ fontSize: '24px', fontWeight: '600' }}>
              Total: {formatCurrency((data?.totalAmount || 0) + (data?.pendingAmount || 0))}
            </span>
          </div>
          <div className="aging-grid">
            <div className="aging-bar current">
              <div className="aging-label">Completed</div>
              <div className="aging-amount">{formatCurrency(data?.totalAmount || 0)}</div>
              <div className="aging-count">{data?.completedPayments || 0} Payments</div>
            </div>
            <div className="aging-bar days-30">
              <div className="aging-label">Pending</div>
              <div className="aging-amount">{formatCurrency(data?.pendingAmount || 0)}</div>
              <div className="aging-count">{data?.pendingPayments || 0} Payments</div>
            </div>
            <div className="aging-bar days-60">
              <div className="aging-label">Total Payments</div>
              <div className="aging-amount">{data?.totalPayments || 0}</div>
              <div className="aging-count">All time</div>
            </div>
            <div className="aging-bar days-90">
              <div className="aging-label">Invoices</div>
              <div className="aging-amount">{data?.totalInvoices || 0}</div>
              <div className="aging-count">Total invoices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">Recent Payments</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/payments')}>
            View All
          </button>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentPayments?.map((payment) => (
                  <tr 
                    key={payment.payment_id} 
                    className="clickable-row"
                    onClick={() => navigate(`/payments/${payment.payment_id}`)}
                  >
                    <td>{formatDate(payment.payment_date)}</td>
                    <td className="money">{formatCurrency(parseFloat(payment.total_amount))}</td>
                    <td>{payment.payment_method}</td>
                    <td>
                      <span className={`status-badge ${payment.status}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!data?.recentPayments || data.recentPayments.length === 0) && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#6b7280' }}>
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

export default Dashboard
