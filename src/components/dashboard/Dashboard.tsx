import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { state } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome to ServiceConnect!</h1>
        <p>Hello {state.user?.name || 'User'}, welcome to your dashboard.</p>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>🔗 Connected Services</h3>
          <p>Browse and book local services</p>
          <a href="/services" className="btn btn-primary">View Services</a>
        </div>
        
        <div className="stat-card">
          <h3>📅 Your Bookings</h3>
          <p>Manage your appointments</p>
          <a href="/bookings" className="btn btn-secondary">View Bookings</a>
        </div>
        
        <div className="stat-card">
          <h3>⚙️ Backend Status</h3>
          <p>API: Connected ✅</p>
          <small>Ready for service interactions</small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;