import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import CorpayLogo from './CorpayLogo'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, setError } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    await login(email, password)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <CorpayLogo />
        </div>
        
        <h1 className="login-title">Corpay Vendor Portal</h1>
        <p className="login-subtitle">Securely manage payments with Corpay</p>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', padding: '16px', background: '#f5f7fa', borderRadius: '8px', fontSize: '13px' }}>
          <strong>Demo Credentials:</strong>
          <div style={{ marginTop: '8px', color: '#6b7280' }}>
            <div>James@ACMELandscaping.com / Landscape2026!</div>
            <div>Tim@ABCconstruction.com / BuildIt99#</div>
            <div>John@GenericUniversity.com / Campus456$</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
