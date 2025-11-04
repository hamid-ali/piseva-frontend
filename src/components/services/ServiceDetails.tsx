import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceService, userService, Service, ProviderProfile } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import BookingForm from '../bookings/BookingForm';
import './Services.css';

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  
  const [service, setService] = useState<Service | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadServiceDetails();
    }
  }, [id]);

  const loadServiceDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const [serviceData, providerData] = await Promise.all([
        serviceService.getServiceById(id),
        serviceService.getServiceById(id).then(service => 
          userService.getProviderProfile(service.provider._id)
        )
      ]);

      setService(serviceData);
      setProvider(providerData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingCreated = () => {
    setShowBookingForm(false);
    showNotification('Booking request sent successfully!', 'success');
    navigate('/bookings');
  };

  const handleBookService = () => {
    if (!state.user) {
      showNotification('Please log in to book services', 'error');
      navigate('/auth');
      return;
    }

    if (state.user.userType !== 'customer') {
      showNotification('Only customers can book services', 'error');
      return;
    }

    setShowBookingForm(true);
  };

  if (loading) {
    return (
      <div className="service-details">
        <div className="loading">Loading service details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="service-details">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!service || !provider) {
    return (
      <div className="service-details">
        <div className="error-message">Service not found</div>
        <button onClick={() => navigate('/services')} className="btn btn-secondary">
          Browse Services
        </button>
      </div>
    );
  }

  return (
    <div className="service-details">
      <div className="service-details-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>
        <div className="service-status">
          <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
            {service.isActive ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="service-details-content">
        <div className="service-main-info">
          <div className="service-header">
            <span className="service-category">{service.category}</span>
            <h1>{service.title}</h1>
            
            <div className="service-rating">
              <div className="rating-stars">
                {'★'.repeat(Math.floor(service.rating.average))}
                {'☆'.repeat(5 - Math.floor(service.rating.average))}
              </div>
              <span className="rating-text">
                {service.rating.average.toFixed(1)} ({service.rating.count} reviews)
              </span>
            </div>
          </div>

          <div className="service-description">
            <h3>Service Description</h3>
            <p>{service.description}</p>
          </div>

          <div className="service-details-grid">
            <div className="detail-card">
              <h4>💰 Pricing</h4>
              <p className="price-amount">{serviceService.formatPrice(service.pricing)}</p>
              {service.pricing.type === 'hourly' && (
                <small>Per hour rate</small>
              )}
              {service.pricing.type === 'negotiable' && (
                <small>Contact provider for quote</small>
              )}
            </div>

            <div className="detail-card">
              <h4>⏱️ Duration</h4>
              <p>{serviceService.formatDuration(service.duration)}</p>
              <small>Estimated time</small>
            </div>

            <div className="detail-card">
              <h4>📍 Service Area</h4>
              <p>{service.location.address}</p>
              {service.location.serviceRadius && (
                <small>Within {service.location.serviceRadius}km radius</small>
              )}
            </div>

            <div className="detail-card">
              <h4>📊 Statistics</h4>
              <div className="stats">
                {service.metadata && (
                  <>
                    <div>👀 {service.metadata.views} views</div>
                    <div>💬 {service.metadata.inquiries} inquiries</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {service.availability && (
            <div className="availability-section">
              <h3>Availability</h3>
              <div className="availability-days">
                <strong>Available Days:</strong>
                <div className="days-list">
                  {service.availability.days.map(day => (
                    <span key={day} className="day-badge">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="availability-times">
                <strong>Time Slots:</strong>
                <div className="time-slots">
                  {service.availability.timeSlots.map((slot, index) => (
                    <span key={index} className="time-slot">
                      {slot.start} - {slot.end}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {service.requirements && service.requirements.length > 0 && (
            <div className="requirements-section">
              <h3>Requirements</h3>
              <ul className="requirements-list">
                {service.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {service.tags && service.tags.length > 0 && (
            <div className="tags-section">
              <h3>Tags</h3>
              <div className="service-tags">
                {service.tags.map((tag, index) => (
                  <span key={index} className="service-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="provider-sidebar">
          <div className="provider-card">
            <div className="provider-header">
              <div className="provider-avatar">
                {provider.name.charAt(0).toUpperCase()}
              </div>
              <div className="provider-info">
                <h3>{provider.name}</h3>
                <p className="provider-type">Service Provider</p>
              </div>
            </div>

            <div className="provider-stats">
              <div className="stat">
                <span className="stat-value">{provider.rating?.average?.toFixed(1) || '0.0'}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">{provider.rating?.count || 0}</span>
                <span className="stat-label">Reviews</span>
              </div>
              <div className="stat">
                <span className="stat-value">{provider.experience || 0}</span>
                <span className="stat-label">Years Exp.</span>
              </div>
            </div>

            {provider.bio && (
              <div className="provider-bio">
                <h4>About</h4>
                <p>{provider.bio}</p>
              </div>
            )}

            <div className="provider-services">
              <h4>Service Categories</h4>
              <div className="categories-list">
                {provider.serviceCategories?.map((category, index) => (
                  <span key={index} className="category-badge">
                    {category}
                  </span>
                ))}
              </div>
            </div>

            {provider.services && provider.services.length > 0 && (
              <div className="other-services">
                <h4>Other Services</h4>
                <div className="services-list">
                  {provider.services
                    .filter(s => s._id !== service._id)
                    .slice(0, 3)
                    .map(s => (
                      <div key={s._id} className="mini-service">
                        <span className="service-name">{s.title}</span>
                        <span className="service-rating">
                          ⭐ {s.rating.average.toFixed(1)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="provider-actions">
              {service.isActive && state.user?.userType === 'customer' ? (
                <button 
                  onClick={handleBookService}
                  className="btn btn-primary btn-large"
                >
                  Book This Service
                </button>
              ) : (
                <button className="btn btn-secondary btn-large" disabled>
                  {!service.isActive ? 'Service Unavailable' : 
                   !state.user ? 'Login to Book' : 
                   'Only Customers Can Book'}
                </button>
              )}
            </div>
          </div>

          {provider.reviews && provider.reviews.length > 0 && (
            <div className="reviews-section">
              <h3>Recent Reviews</h3>
              <div className="reviews-list">
                {provider.reviews.slice(0, 3).map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <span className="reviewer-name">{review.reviewer.name}</span>
                      <div className="review-rating">
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showBookingForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <BookingForm
              service={service}
              onBookingCreated={handleBookingCreated}
              onCancel={() => setShowBookingForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetails;