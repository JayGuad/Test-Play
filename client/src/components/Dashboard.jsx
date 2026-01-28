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

  const pendingTotals = data?.pendingTotals || { count: 0, amount: 0 }
  const completedTotals = data?.completedTotals || { count: 0, amount: 0 }
  const pendingByMethod = data?.pendingByMethod || []
  const completedByMethod = data?.completedByMethod || []

  const renderMethodBars = (methods) => {
    const maxAmount = methods.reduce((max, method) => (
      method.amount > max ? method.amount : max
    ), 0)

    if (methods.length === 0) {
      return <div style={{ color: '#6b7280' }}>No payments to display.</div>
    }

    return methods.map((method) => {
      const width = maxAmount > 0 ? (method.amount / maxAmount) * 100 : 0
      return (
        <div className="bar-row" key={method.method}>
          <div className="bar-label">{method.method}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${width}%` }}></div>
          </div>
          <div className="bar-meta">
            {formatCurrency(method.amount)} · {method.count}
          </div>
        </div>
      )
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

      {/* Payment Charts */}
      <div className="dashboard-charts">
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pending by Modality</h2>
              <div className="chart-subtitle">
                {formatCurrency(pendingTotals.amount)} · {pendingTotals.count} payments
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bar-list">
              {renderMethodBars(pendingByMethod)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Completed by Modality</h2>
              <div className="chart-subtitle">
                {formatCurrency(completedTotals.amount)} · {completedTotals.count} payments
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="bar-list">
              {renderMethodBars(completedByMethod)}
            </div>
          </div>
        </div>
      </div>

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
