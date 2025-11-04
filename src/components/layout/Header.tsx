import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';

const Header: React.FC = () => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <Link to="/dashboard" className="logo-link">
            <h1 className="logo">ServiceConnect</h1>
          </Link>
        </div>

        {state.isAuthenticated && state.user && (
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{state.user.name}</span>
              <span className="user-type">
                {state.user.userType === 'provider' ? '🔧 Provider' : '👤 Customer'}
              </span>
            </div>
            
            <div className="header-actions">
              <Link to="/dashboard" className="nav-button">
                📊 Dashboard
              </Link>
              
              {state.user.userType === 'customer' && (
                <>
                  <Link to="/services" className="nav-button">
                    🔍 Browse Services
                  </Link>
                  <Link to="/search" className="nav-button">
                    📍 Find Providers
                  </Link>
                </>
              )}
              
              {state.user.userType === 'provider' && (
                <Link to="/my-services" className="nav-button">
                  ⚙️ My Services
                </Link>
              )}
              
              <Link to="/bookings" className="nav-button">
                📋 Bookings
              </Link>
              
              <Link to="/profile" className="nav-button">
                👤 Profile
              </Link>
              
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;