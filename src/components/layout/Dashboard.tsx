import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services';
import { BookingStats } from '../../services/bookingService';
import './Layout.css';

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const bookingStats = await bookingService.getBookingStats();
      setStats(bookingStats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  const user = state.user!;
  const isProvider = user.userType === 'provider';

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user.name}!</h1>
        <p className="dashboard-subtitle">
          {isProvider 
            ? 'Manage your services and bookings' 
            : 'Find and book local services'}
        </p>
      </div>

      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">All time</div>
          </div>

          {stats.byStatus.map((status: any) => (
            <div key={status._id} className="stat-card">
              <h3>{status._id.charAt(0).toUpperCase() + status._id.slice(1)}</h3>
              <div className="stat-value">{status.count}</div>
              <div className="stat-label">
                ${status.totalAmount.toLocaleString()} total
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Recent Bookings</h2>
          </div>
          <div className="section-content">
            {stats?.recent && stats.recent.length > 0 ? (
              <div className="booking-list">
                {stats.recent.slice(0, 5).map((booking: any) => (
                  <div key={booking._id} className="booking-item">
                    <div className="booking-info">
                      <h4>{booking.service.title}</h4>
                      <p className="booking-date">
                        {bookingService.formatDate(booking.scheduledDate)} at{' '}
                        {bookingService.formatTimeSlot(booking.scheduledTime)}
                      </p>
                      <p className="booking-participants">
                        {isProvider ? booking.customer.name : booking.provider.name}
                      </p>
                    </div>
                    <div className="booking-status">
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: bookingService.getStatusColor(booking.status) + '20',
                          color: bookingService.getStatusColor(booking.status)
                        }}
                      >
                        {bookingService.getStatusLabel(booking.status)}
                      </span>
                      <div className="booking-amount">
                        ${booking.pricing.quotedAmount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <div className="empty-state-text">No recent bookings</div>
                <div className="empty-state-subtext">
                  {isProvider 
                    ? 'Bookings will appear here when customers book your services'
                    : 'Start by browsing and booking services in your area'}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title">
              {isProvider ? 'Service Performance' : 'Quick Actions'}
            </h2>
          </div>
          <div className="section-content">
            {isProvider ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-text">Service insights coming soon</div>
                <div className="empty-state-subtext">
                  Track your service performance and customer feedback
                </div>
              </div>
            ) : (
              <div className="quick-actions">
                <button className="action-button">
                  🔍 Browse Services
                </button>
                <button className="action-button">
                  📋 My Bookings
                </button>
                <button className="action-button">
                  👤 Update Profile
                </button>
                <button className="action-button">
                  ⭐ Rate & Review
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;