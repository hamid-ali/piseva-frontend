import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingService, Booking, BookingMessage, BookingRating } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Bookings.css';

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      loadBookingDetails();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [booking?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadBookingDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const bookingData = await bookingService.getBookingById(id);
      setBooking(bookingData);
    } catch (error: any) {
      showNotification('Failed to load booking details', 'error');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !id) return;

    try {
      setSendingMessage(true);
      const newMessage = await bookingService.addMessage(id, {
        message: messageText.trim()
      });

      // Update the booking with the new message
      setBooking(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), newMessage]
      } : null);

      setMessageText('');
      showNotification('Message sent!', 'success');
    } catch (error: any) {
      showNotification('Failed to send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

    const handleStatusUpdate = async (newStatus: Booking['status']) => {
    if (!booking || !id) return;

    const isProvider = state.user?.userType === 'provider';
    if (!bookingService.canUpdateStatus(booking.status, newStatus, state.user?.userType || 'customer')) {
      showNotification('Invalid status transition', 'error');
      return;
    }

    try {
      setUpdatingStatus(true);
      
      // Filter out 'pending' status as it's not allowed in updates
      if (newStatus === 'pending') return;
      
      const updatedBooking = await bookingService.updateBookingStatus(id, {
        status: newStatus as 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled' | 'disputed',
        reason: `Status updated to ${newStatus}`
      });

      setBooking(updatedBooking);
      showNotification(`Booking ${newStatus}!`, 'success');
    } catch (error: any) {
      showNotification('Failed to update booking status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setSubmittingRating(true);
      const newRating = await bookingService.addRating(id, {
        rating,
        comment: ratingComment.trim() || undefined
      });

      // Update the booking with the new rating
      setBooking(prev => prev ? {
        ...prev,
        ratings: [...(prev.ratings || []), newRating]
      } : null);

      setShowRatingModal(false);
      setRating(5);
      setRatingComment('');
      showNotification('Rating submitted!', 'success');
    } catch (error: any) {
      showNotification('Failed to submit rating', 'error');
    } finally {
      setSubmittingRating(false);
    }
  };

  const canRate = (): boolean => {
    if (!booking || !state.user) return false;
    
    // Only allow rating for completed bookings
    if (booking.status !== 'completed') return false;
    
    // Check if user hasn't already rated
    const existingRating = booking.ratings?.find(r => r.rater._id === state.user!._id);
    return !existingRating;
  };

  const getAvailableStatusTransitions = (): Booking['status'][] => {
    if (!booking || !state.user) return [];

    const transitions: Record<Booking['status'], Booking['status'][]> = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['in-progress', 'cancelled'],
      rejected: [],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      disputed: []
    };

    const isProvider = state.user.userType === 'provider';
    const available = transitions[booking.status] || [];

    return available.filter(status => 
      bookingService.canUpdateStatus(booking.status, status, state.user!.userType)
    );
  };

  if (loading) {
    return (
      <div className="booking-details">
        <div className="loading">Loading booking details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="booking-details">
        <div className="error">Booking not found</div>
      </div>
    );
  }

  const isProvider = state.user?.userType === 'provider';
  const otherParty = isProvider ? booking.customer : booking.provider;

  return (
    <div className="booking-details">
      <div className="booking-header">
        <button onClick={() => navigate('/bookings')} className="back-btn">
          ← Back to Bookings
        </button>
        <h2>Booking Details</h2>
        <div className={`status-badge ${booking.status}`}>
          {bookingService.getStatusLabel(booking.status)}
        </div>
      </div>

      <div className="booking-content">
        <div className="booking-info">
          <div className="info-section">
            <h3>Service Information</h3>
            <div className="service-card">
              <h4>{booking.service.title}</h4>
              <p className="category">📂 {booking.service.category}</p>
              <p className="price">💰 ${booking.pricing.quotedAmount}</p>
            </div>
          </div>

          <div className="info-section">
            <h3>Schedule</h3>
            <div className="schedule-info">
              <p>📅 {bookingService.formatDate(booking.scheduledDate)}</p>
              <p>🕐 {bookingService.formatTimeSlot(booking.scheduledTime)}</p>
            </div>
          </div>

          <div className="info-section">
            <h3>{isProvider ? 'Customer' : 'Provider'}</h3>
            <div className="party-info">
              <p>👤 {otherParty.name}</p>
              <p>📞 {otherParty.phone}</p>
            </div>
          </div>

          <div className="info-section">
            <h3>Location</h3>
            <div className="location-info">
              <p>📍 {booking.location.address}</p>
              {booking.location.additionalInfo && (
                <p>ℹ️ {booking.location.additionalInfo}</p>
              )}
            </div>
          </div>

          {booking.customerRequirements && (
            <div className="info-section">
              <h3>Requirements</h3>
              <p>{booking.customerRequirements}</p>
            </div>
          )}

          <div className="info-section">
            <h3>Actions</h3>
            <div className="booking-actions">
              {getAvailableStatusTransitions().map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus}
                  className={`btn status-btn ${status}`}
                >
                  {bookingService.getStatusLabel(status)}
                </button>
              ))}
              
              {canRate() && (
                <button
                  onClick={() => setShowRatingModal(true)}
                  className="btn btn-primary"
                >
                  ⭐ Rate & Review
                </button>
              )}
            </div>
          </div>

          {booking.ratings && booking.ratings.length > 0 && (
            <div className="info-section">
              <h3>Ratings & Reviews</h3>
              <div className="ratings-list">
                {booking.ratings.map(rating => (
                  <div key={rating._id} className="rating-item">
                    <div className="rating-header">
                      <span className="rater-name">{rating.rater.name}</span>
                      <div className="stars">
                        {'★'.repeat(rating.rating)}
                        {'☆'.repeat(5 - rating.rating)}
                      </div>
                    </div>
                    {rating.comment && (
                      <p className="rating-comment">{rating.comment}</p>
                    )}
                    <small className="rating-date">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="booking-chat">
          <h3>Messages</h3>
          <div className="messages-container">
            {booking.messages && booking.messages.length > 0 ? (
              booking.messages.map(message => (
                <div
                  key={message._id}
                  className={`message ${message.sender._id === state.user?._id ? 'own' : 'other'}`}
                >
                  <div className="message-header">
                    <span className="sender-name">{message.sender.name}</span>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="message-content">{message.message}</div>
                </div>
              ))
            ) : (
              <div className="no-messages">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <div className="message-input-group">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                disabled={sendingMessage}
              />
              <button 
                type="submit" 
                disabled={sendingMessage || !messageText.trim()}
                className="send-btn"
              >
                {sendingMessage ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="modal-overlay">
          <div className="modal-content rating-modal">
            <form onSubmit={handleSubmitRating}>
              <div className="modal-header">
                <h3>Rate & Review</h3>
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>

              <div className="rating-form">
                <div className="form-group">
                  <label>Rating</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`star ${rating >= star ? 'selected' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rating-comment">Comment (Optional)</label>
                  <textarea
                    id="rating-comment"
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                    maxLength={500}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="btn btn-primary"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;