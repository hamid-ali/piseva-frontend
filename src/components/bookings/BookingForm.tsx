import React, { useState } from 'react';
import { Service, CreateBookingData, bookingService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import './Bookings.css';

interface BookingFormProps {
  service: Service;
  onBookingCreated: () => void;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ service, onBookingCreated, onCancel }) => {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    scheduledTime: {
      start: '',
      end: ''
    },
    location: {
      coordinates: [0, 0] as [number, number],
      address: '',
      additionalInfo: ''
    },
    customerRequirements: '',
    pricing: {
      quotedAmount: service.pricing.amount || 0
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else if (name === 'additionalInfo') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, additionalInfo: value }
      }));
    } else if (name === 'startTime' || name === 'endTime') {
      setFormData(prev => ({
        ...prev,
        scheduledTime: {
          ...prev.scheduledTime,
          [name === 'startTime' ? 'start' : 'end']: value
        }
      }));
    } else if (name === 'quotedAmount') {
      setFormData(prev => ({
        ...prev,
        pricing: { ...prev.pricing, quotedAmount: parseFloat(value) || 0 }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Please enter your coordinates manually.');
      return;
    }

    // Show loading state
    const button = document.querySelector('.location-button') as HTMLButtonElement;
    if (button) {
      button.textContent = '⏳';
      button.disabled = true;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            coordinates: [longitude, latitude]
          }
        }));
        
        // Clear any previous error
        setError(null);
        
        // Reset button
        if (button) {
          button.textContent = '✅';
          button.disabled = false;
          setTimeout(() => {
            button.textContent = '📍';
          }, 2000);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        setError(errorMessage + ' You can still book by entering the service address manually.');
        
        // Reset button
        if (button) {
          button.textContent = '❌';
          button.disabled = false;
          setTimeout(() => {
            button.textContent = '📍';
          }, 3000);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.scheduledDate || !formData.scheduledTime.start || !formData.scheduledTime.end) {
      setError('Please select a date and time for the service.');
      return;
    }

    if (!formData.location.address.trim()) {
      setError('Please provide a service location.');
      return;
    }

    // Check if coordinates are valid (not default [0, 0])
    if (formData.location.coordinates[0] === 0 && formData.location.coordinates[1] === 0) {
      setError('Please click "Use Current Location" to set your coordinates, or enter your exact location.');
      return;
    }

    // Check if the scheduled date is in the future
    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime.start}`);
    if (scheduledDateTime <= new Date()) {
      setError('Please select a future date and time.');
      return;
    }

    try {
      setLoading(true);

      const bookingData: CreateBookingData = {
        service: service._id,
        provider: service.provider._id,
        scheduledDate: formData.scheduledDate,
        scheduledTime: {
          start: formData.scheduledTime.start,
          end: formData.scheduledTime.end
        },
        location: {
          coordinates: formData.location.coordinates,
          address: formData.location.address,
          additionalInfo: formData.location.additionalInfo || undefined
        },
        customerRequirements: formData.customerRequirements || undefined,
        pricing: formData.pricing
      };

      await bookingService.createBooking(bookingData);
      onBookingCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!state.user || state.user.userType !== 'customer') {
    return (
      <div className="booking-form-container">
        <div className="error-message">
          Only customers can book services.
        </div>
      </div>
    );
  }

  return (
    <div className="booking-form-container">
      <div className="booking-form-header">
        <h2>Book Service</h2>
        <button className="close-button" onClick={onCancel}>×</button>
      </div>

      <div className="service-summary">
        <h3>{service.title}</h3>
        <p className="provider-name">by {service.provider.name}</p>
        <p className="service-price">{service.pricing.amount ? `$${service.pricing.amount}` : 'Price negotiable'}</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-section">
          <h4>When do you need this service?</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduledDate">Date</label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.scheduledTime.start}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.scheduledTime.end}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h4>Where should the service be provided?</h4>
          
          <div className="form-group">
            <label htmlFor="address">Service Address</label>
            <div className="address-input">
              <input
                type="text"
                id="address"
                name="address"
                value={formData.location.address}
                onChange={handleChange}
                placeholder="Enter the service location"
                required
              />
              <button
                type="button"
                className="location-button"
                onClick={getCurrentLocation}
                title="Use current location"
              >
                📍
              </button>
            </div>
            <small>Click 📍 to use your current location, or enter coordinates manually below.</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                step="any"
                value={formData.location.coordinates[1]}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      coordinates: [prev.location.coordinates[0], lat]
                    }
                  }));
                }}
                placeholder="e.g., 40.7128"
              />
            </div>
            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                step="any"
                value={formData.location.coordinates[0]}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      coordinates: [lng, prev.location.coordinates[1]]
                    }
                  }));
                }}
                placeholder="e.g., -74.0060"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="additionalInfo">Additional Location Info (Optional)</label>
            <input
              type="text"
              id="additionalInfo"
              name="additionalInfo"
              value={formData.location.additionalInfo}
              onChange={handleChange}
              placeholder="e.g., Apartment 3B, Ring doorbell"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="customerRequirements">Special Requirements (Optional)</label>
            <textarea
              id="customerRequirements"
              name="customerRequirements"
              value={formData.customerRequirements}
              onChange={handleChange}
              rows={3}
              placeholder="Any specific requirements or details about the job..."
              maxLength={1000}
            />
          </div>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label htmlFor="quotedAmount">Quoted Amount ($)</label>
            <input
              type="number"
              id="quotedAmount"
              name="quotedAmount"
              value={formData.pricing.quotedAmount}
              onChange={handleChange}
              min={0}
              step={0.01}
              required
            />
            <small>This is your expected budget for this service.</small>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Booking...' : 'Book Service'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;