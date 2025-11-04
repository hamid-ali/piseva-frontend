import React, { useState, useEffect } from 'react';
import { authService, UpdateProfileData, ChangePasswordData, User } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Profile.css';

const ProfileSettings: React.FC = () => {
  const { state, dispatch } = useAuth();
  const { showNotification } = useNotifications();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    name: '',
    phone: '',
    location: {
      coordinates: [0, 0],
      address: ''
    },
    serviceCategories: [],
    serviceRadius: 10,
    experience: 0,
    bio: ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Available service categories (you might want to fetch this from the API)
  const availableCategories = [
    'Plumbing', 'Electrical', 'Cleaning', 'Gardening', 'Carpentry',
    'Painting', 'Moving', 'Appliance Repair', 'HVAC', 'Pest Control',
    'Home Security', 'Roofing', 'Flooring', 'Windows & Doors'
  ];

  useEffect(() => {
    if (state.user) {
      setProfileData({
        name: state.user.name || '',
        phone: state.user.phone || '',
        location: state.user.location || {
          coordinates: [0, 0],
          address: ''
        },
        serviceCategories: state.user.serviceCategories || [],
        serviceRadius: state.user.serviceRadius || 10,
        experience: state.user.experience || 0,
        bio: state.user.bio || ''
      });
    }
  }, [state.user]);

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!profileData.name?.trim()) newErrors.name = 'Name is required';
    if (!profileData.phone?.trim()) newErrors.phone = 'Phone is required';
    if (!profileData.location?.address?.trim()) newErrors.address = 'Address is required';
    
    if (state.user?.userType === 'provider') {
      if (!profileData.serviceCategories?.length) {
        newErrors.serviceCategories = 'At least one service category is required';
      }
      if ((profileData.serviceRadius || 0) < 1) {
        newErrors.serviceRadius = 'Service radius must be at least 1 km';
      }
      if ((profileData.experience || 0) < 0) {
        newErrors.experience = 'Experience cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }
    if (passwordData.newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;

    try {
      setLoading(true);
      const updatedUser = await authService.updateProfile(profileData);
      
      // Update auth context
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      showNotification('Profile updated successfully!', 'success');
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Failed to update profile',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    try {
      setLoading(true);
      await authService.changePassword(passwordData);
      
      // Clear form
      setPasswordData({ currentPassword: '', newPassword: '' });
      setConfirmPassword('');
      
      showNotification('Password changed successfully!', 'success');
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Failed to change password',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProfileInputChange = (field: string, value: any) => {
    setProfileData((prev: UpdateProfileData) => {
      const newData = { ...prev };
      const keys = field.split('.');
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleServiceCategory = (category: string) => {
    const current = profileData.serviceCategories || [];
    if (current.includes(category)) {
      handleProfileInputChange('serviceCategories', current.filter((c: string) => c !== category));
    } else {
      handleProfileInputChange('serviceCategories', [...current, category]);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          handleProfileInputChange('location.coordinates', [longitude, latitude]);
          showNotification('Location updated! Please enter your address.', 'success');
        },
        (error) => {
          showNotification('Failed to get current location', 'error');
        }
      );
    } else {
      showNotification('Geolocation is not supported by this browser', 'error');
    }
  };

  if (!state.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-settings">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        <div className="user-info">
          <div className="user-avatar">
            {state.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{state.user.name}</h3>
            <p className="user-type">
              {state.user.userType === 'provider' ? '🔧 Service Provider' : '👤 Customer'}
            </p>
          </div>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={`tab ${activeTab === 'password' ? 'active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="settings-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                value={profileData.name || ''}
                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={state.user.email}
                disabled
                className="disabled"
              />
              <small>Email cannot be changed</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>
            
            <div className="form-group">
              <label htmlFor="address">Address *</label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="address"
                  value={profileData.location?.address || ''}
                  onChange={(e) => handleProfileInputChange('location.address', e.target.value)}
                  className={errors.address ? 'error' : ''}
                  placeholder="Enter your address"
                />
                <button type="button" onClick={getCurrentLocation} className="location-btn">
                  📍 Use Current Location
                </button>
              </div>
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>
          </div>

          {state.user.userType === 'provider' && (
            <>
              <div className="form-section">
                <h3>Service Categories *</h3>
                <div className="checkbox-grid">
                  {availableCategories.map(category => (
                    <label key={category} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(profileData.serviceCategories || []).includes(category)}
                        onChange={() => toggleServiceCategory(category)}
                      />
                      {category}
                    </label>
                  ))}
                </div>
                {errors.serviceCategories && (
                  <span className="error-message">{errors.serviceCategories}</span>
                )}
              </div>

              <div className="form-section">
                <h3>Service Details</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="serviceRadius">Service Radius (km)</label>
                    <input
                      type="number"
                      id="serviceRadius"
                      value={profileData.serviceRadius || 10}
                      onChange={(e) => handleProfileInputChange('serviceRadius', parseInt(e.target.value) || 10)}
                      min="1"
                      max="50"
                      className={errors.serviceRadius ? 'error' : ''}
                    />
                    {errors.serviceRadius && <span className="error-message">{errors.serviceRadius}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Years of Experience</label>
                    <input
                      type="number"
                      id="experience"
                      value={profileData.experience || 0}
                      onChange={(e) => handleProfileInputChange('experience', parseInt(e.target.value) || 0)}
                      min="0"
                      max="50"
                      className={errors.experience ? 'error' : ''}
                    />
                    {errors.experience && <span className="error-message">{errors.experience}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={profileData.bio || ''}
                    onChange={(e) => handleProfileInputChange('bio', e.target.value)}
                    placeholder="Tell customers about yourself and your services..."
                    rows={4}
                    maxLength={500}
                  />
                  <small>{(profileData.bio || '').length}/500 characters</small>
                </div>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="settings-form">
          <div className="form-section">
            <h3>Change Password</h3>
            
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password *</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData((prev: ChangePasswordData) => ({ ...prev, currentPassword: e.target.value }))}
                className={errors.currentPassword ? 'error' : ''}
              />
              {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev: ChangePasswordData) => ({ ...prev, newPassword: e.target.value }))}
                className={errors.newPassword ? 'error' : ''}
              />
              {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
              <small>Must be at least 6 characters long</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileSettings;