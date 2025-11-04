import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterData } from '../../services';
import './Auth.css';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register, state } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  
  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: 'customer',
    location: {
      coordinates: [0, 0],
      address: '',
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding to get address (you might want to use a proper service)
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setFormData(prev => ({
            ...prev,
            location: {
              coordinates: [longitude, latitude],
              address: address
            }
          }));
        } catch (error) {
          console.error('Error getting address:', error);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        alert('Unable to get your location. Please enter your address manually.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      setStep(2);
      return;
    }

    // Validate required fields
    if (!formData.location.address.trim()) {
      alert('Please provide your address');
      return;
    }

    try {
      await register(formData);
      // Navigate to the intended page or dashboard after successful registration
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by context
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="auth-form">
      <h2>Create Account</h2>
      <p className="auth-subtitle">
        Join our community of service providers and customers
      </p>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <div className="form-group">
              <label htmlFor="userType">I am a</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="customer">Customer (Looking for services)</option>
                <option value="provider">Service Provider (Offering services)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a password"
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="form-group">
              <label htmlFor="address">Your Address</label>
              <div className="address-input">
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.location.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter your address"
                />
                <button
                  type="button"
                  className="location-button"
                  onClick={getCurrentLocation}
                  disabled={locationLoading}
                >
                  {locationLoading ? '📍...' : '📍'}
                </button>
              </div>
              <small>We'll use this to show you nearby services</small>
            </div>

            {formData.userType === 'provider' && (
              <>
                <div className="form-group">
                  <label htmlFor="experience">Years of Experience</label>
                  <input
                    type="number"
                    id="experience"
                    name="experience"
                    value={formData.experience || ''}
                    onChange={handleChange}
                    min={0}
                    max={50}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Brief Bio (Optional)</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    placeholder="Tell customers about yourself and your services..."
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </>
            )}
          </>
        )}

        {state.error && (
          <div className="error-message">
            {state.error}
          </div>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              type="button"
              className="back-button"
              onClick={goBack}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            className="auth-button"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Creating Account...' : 
             step === 1 ? 'Next' : 'Create Account'}
          </button>
        </div>
      </form>

      <div className="auth-switch">
        Already have an account?{' '}
        <button
          type="button"
          className="link-button"
          onClick={onSwitchToLogin}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;