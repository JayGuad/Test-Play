import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function VirtualCards() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedCards, setRevealedCards] = useState({})

  useEffect(() => {
    fetchCards()
  }, [user])

  const fetchCards = async () => {
    try {
      const response = await fetch(`/api/virtualcards/${user.vendor_id}`)
      const data = await response.json()
      setCards(data)
    } catch (error) {
      console.error('Error fetching virtual cards:', error)
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

  const toggleReveal = (paymentId) => {
    setRevealedCards(prev => ({
      ...prev,
      [paymentId]: !prev[paymentId]
    }))
  }

  const formatCardNumber = (cardNumber, revealed) => {
    if (!cardNumber) return ''
    if (revealed) {
      return cardNumber.replace(/(.{4})/g, '$1 ').trim()
    }
    return `**** **** **** ${cardNumber.slice(-4)}`
  }

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text)
    alert(`${label} copied to clipboard!`)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading virtual cards...
      </div>
    )
  }

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxWidth: '500px' }}>
        <div className="stat-card primary">
          <div className="stat-label">Total Virtual Cards</div>
          <div className="stat-value">{cards.length}</div>
        </div>
        <div className="stat-card teal">
          <div className="stat-label">Total Value</div>
          <div className="stat-value">
            {formatCurrency(cards.reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="section">
        <h2 className="section-title">Your Virtual Cards</h2>
        
        {cards.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
              No virtual cards found. Virtual cards are issued when payments are made via the Virtual Card method.
            </div>
          </div>
        ) : (
          <div className="cards-grid">
            {cards.map((card) => {
              const isRevealed = revealedCards[card.payment_id]
              const isExpired = new Date(`20${card.card_expiration.split('/')[1]}`, parseInt(card.card_expiration.split('/')[0]) - 1) < new Date()
              
              return (
                <div key={card.payment_id} className="virtual-card">
                  {/* Card Status */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    right: '16px',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: card.status === 'completed' 
                      ? 'rgba(16, 185, 129, 0.2)' 
                      : 'rgba(245, 158, 11, 0.2)',
                    color: card.status === 'completed' ? '#10b981' : '#f59e0b'
                  }}>
                    {card.status === 'completed' ? 'Used' : 'Active'}
                  </div>

                  {/* Chip */}
                  <div className="card-chip"></div>

                  {/* Card Number */}
                  <div className="card-number">
                    {formatCardNumber(card.card_number, isRevealed)}
                    <button 
                      className="reveal-btn"
                      onClick={() => toggleReveal(card.payment_id)}
                    >
                      {isRevealed ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {/* Card Details */}
                  <div className="card-details">
                    <div className="card-detail-group">
                      <span className="card-detail-label">Expires</span>
                      <span className="card-detail-value">{card.card_expiration}</span>
                    </div>
                    <div className="card-detail-group">
                      <span className="card-detail-label">CVV</span>
                      <span className="card-detail-value">
                        {isRevealed ? card.card_cvv : '***'}
                      </span>
                    </div>
                    <div className="card-detail-group">
                      <span className="card-detail-label">Amount</span>
                      <span className="card-detail-value">
                        {formatCurrency(parseFloat(card.total_amount))}
                      </span>
                    </div>
                  </div>

                  {/* Brand */}
                  <div className="card-brand">VISA</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Card Table */}
      {cards.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Card Details</h2>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Card Number</th>
                    <th>Expiration</th>
                    <th>Amount</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card) => {
                    const isRevealed = revealedCards[card.payment_id]
                    return (
                      <tr key={card.payment_id}>
                        <td style={{ fontWeight: 500 }}>#{card.payment_id}</td>
                        <td style={{ fontFamily: 'monospace' }}>
                          {formatCardNumber(card.card_number, isRevealed)}
                        </td>
                        <td>{card.card_expiration}</td>
                        <td className="money" style={{ fontWeight: 600 }}>
                          {formatCurrency(parseFloat(card.total_amount))}
                        </td>
                        <td>{formatDate(card.payment_date)}</td>
                        <td>
                          <span className={`status-badge ${card.status}`}>
                            {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => toggleReveal(card.payment_id)}
                            >
                              {isRevealed ? 'Hide' : 'Reveal'}
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => navigate(`/payments/${card.payment_id}`)}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VirtualCards
