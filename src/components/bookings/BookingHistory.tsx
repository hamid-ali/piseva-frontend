import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService, { Booking, BookingSearchParams } from '../../services/bookingService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Bookings.css';

const BookingHistory: React.FC = () => {
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<BookingSearchParams>({
    page: 1,
    limit: 10
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings(filters);
      setBookings(response.bookings || []); // Ensure it's always an array
    } catch (error: any) {
      showNotification('Failed to load bookings', 'error');
      console.error('Error fetching bookings:', error);
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to details
    
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await bookingService.cancelBooking(bookingId);
      showNotification('Booking cancelled successfully', 'success');
      loadBookings(); // Refresh the list
    } catch (error: any) {
      showNotification('Failed to cancel booking', 'error');
      console.error('Error canceling booking:', error);
    }
  };

  const handleBookingClick = (bookingId: string) => {
    navigate(`/booking/${bookingId}`);
  };

  const isProvider = state.user?.userType === 'provider';

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="booking-history">
      <h2>Your Bookings</h2>
      
      <div className="filters">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setFilters(prev => ({ 
                ...prev, 
                status: e.target.value === 'all' ? undefined : e.target.value as any
              }));
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sortBy || 'newest'}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              sortBy: e.target.value as any 
            }))}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="scheduled">By Scheduled Date</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>
      
      {(!bookings || bookings.length === 0) ? (
        <div className="empty-state">
          <h3>No bookings found</h3>
          <p>
            {statusFilter !== 'all' 
              ? `No ${statusFilter} bookings found.`
              : 'You haven\'t made any bookings yet.'
            }
          </p>
          {!isProvider && (
            <button 
              onClick={() => navigate('/services')}
              className="btn btn-primary"
            >
              Browse Services
            </button>
          )}
        </div>
      ) : (
        <div className="bookings-grid">
          {bookings && bookings.map(booking => {
            const otherParty = isProvider ? booking.customer : booking.provider;
            
            return (
              <div 
                key={booking._id} 
                className="booking-card clickable"
                onClick={() => handleBookingClick(booking._id)}
              >
                <div className="booking-card-header">
                  <h3>{booking.service.title}</h3>
                  <div className={`status-badge ${booking.status}`}>
                    {bookingService.getStatusLabel(booking.status)}
                  </div>
                </div>
                
                <div className="booking-card-body">
                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="label">📅 Date:</span>
                      <span>{bookingService.formatDate(booking.scheduledDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">🕐 Time:</span>
                      <span>{bookingService.formatTimeSlot(booking.scheduledTime)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">{isProvider ? '👤 Customer:' : '🔧 Provider:'}</span>
                      <span>{otherParty.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">💰 Amount:</span>
                      <span>${booking.pricing.quotedAmount}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">📍 Location:</span>
                      <span>{booking.location.address}</span>
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      <button 
                        onClick={(e) => handleCancelBooking(booking._id, e)}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;