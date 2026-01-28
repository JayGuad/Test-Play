import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatWidget from './ChatWidget'
import CorpayLogo from './CorpayLogo'

// SVG Icons
const DashboardIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const PaymentsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)

const CardsIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const ExportIcon = () => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const CollapseIcon = ({ collapsed }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {collapsed ? (
      <path d="M9 18l6-6-6-6" />
    ) : (
      <path d="M15 18l-6-6 6-6" />
    )}
  </svg>
)

function Layout() {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="app-container">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <CorpayLogo compact={collapsed} theme="dark" />
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <CollapseIcon collapsed={collapsed} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/" 
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <DashboardIcon />
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink 
            to="/payments" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <PaymentsIcon />
            <span className="nav-text">Payments</span>
          </NavLink>
          
          <NavLink 
            to="/cards" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CardsIcon />
            <span className="nav-text">Cards</span>
          </NavLink>
          
          <NavLink 
            to="/export" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <ExportIcon />
            <span className="nav-text">Export</span>
          </NavLink>
        </nav>
      </aside>
      
      <div className="main-content">
        <header className="header">
          <h1 className="header-title">{user?.vendor_name || 'Vendor Portal'}</h1>
          
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.email}</span>
              <div className="user-avatar">
                {getInitials(user?.vendor_name || 'VP')}
              </div>
            </div>
            <button className="logout-btn" onClick={logout}>
              Sign Out
            </button>
          </div>
        </header>
        
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      
      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  )
}

export default Layout
