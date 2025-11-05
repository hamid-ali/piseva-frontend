import React, { useState, useEffect, useCallback } from 'react';
import { serviceService, Service, CreateServiceData, ServiceCategory } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import './Services.css';

const ServiceManagement: React.FC = () => {
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  
  // Form state
  const [formData, setFormData] = useState<CreateServiceData>({
    title: '',
    description: '',
    category: '',
    pricing: {
      type: 'fixed',
      amount: 0,
      currency: 'USD',
      unit: 'job'
    },
    duration: {
      estimated: 60,
      unit: 'minutes'
    },
    location: {
      coordinates: [0, 0],
      address: '',
      serviceRadius: 10
    },
    availability: {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeSlots: [
        { start: '09:00', end: '17:00', available: true }
      ]
    },
    tags: [],
    requirements: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [myServices, serviceCategories] = await Promise.all([
        serviceService.getMyServices({ status: statusFilter }), // Filter by selected status
        serviceService.getServiceCategories()
      ]);
      
      setServices(myServices.data || []); // Ensure it's always an array
      setCategories(serviceCategories || []); // Ensure it's always an array
    } catch (error: any) {
      showNotification('Failed to load services', 'error');
      console.error('Error loading services:', error);
      setServices([]); // Set empty array on error
      setCategories([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]); // Reload when loadData changes

  useEffect(() => {
    if (state.user?.location) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: state.user!.location.coordinates,
          address: state.user!.location.address
        }
      }));
    }
  }, [state.user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.location.address.trim()) newErrors.address = 'Service address is required';
    
    // Validate coordinates
    const [lng, lat] = formData.location.coordinates;
    if (!lng || !lat || lng === 0 || lat === 0) {
      newErrors.coordinates = 'Valid coordinates are required. Please use current location or enter manually.';
    } else {
      if (lat < -90 || lat > 90) newErrors.coordinates = 'Latitude must be between -90 and 90';
      if (lng < -180 || lng > 180) newErrors.coordinates = 'Longitude must be between -180 and 180';
    }
    
    if (formData.pricing.type !== 'negotiable' && !formData.pricing.amount) {
      newErrors.amount = 'Price amount is required';
    }

    if (formData.duration.estimated < 15) {
      newErrors.duration = 'Minimum duration is 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (editingService) {
        await serviceService.updateService(editingService._id, formData);
        showNotification('Service updated successfully!', 'success');
      } else {
        await serviceService.createService(formData);
        showNotification('Service created successfully!', 'success');
      }
      
      resetForm();
      loadData();
    } catch (error: any) {
      showNotification(
        error.response?.data?.message || 'Failed to save service',
        'error'
      );
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await serviceService.deleteService(serviceId);
      showNotification('Service deleted successfully!', 'success');
      loadData();
    } catch (error: any) {
      showNotification('Failed to delete service', 'error');
    }
  };

  const editService = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      pricing: {
        type: service.pricing.type,
        amount: service.pricing.amount || 0,
        currency: service.pricing.currency || 'USD',
        unit: service.pricing.unit || 'job'
      },
      duration: {
        estimated: service.duration.estimated,
        unit: service.duration.unit || 'minutes'
      },
      location: {
        coordinates: service.location.coordinates,
        address: service.location.address,
        serviceRadius: service.location.serviceRadius || 10
      },
      availability: service.availability || {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeSlots: [
          { start: '09:00', end: '17:00', available: true }
        ]
      },
      tags: service.tags || [],
      requirements: service.requirements || []
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      pricing: {
        type: 'fixed',
        amount: 0,
        currency: 'USD',
        unit: 'job'
      },
      duration: {
        estimated: 60,
        unit: 'minutes'
      },
      location: {
        coordinates: state.user?.location?.coordinates || [0, 0],
        address: state.user?.location?.address || '',
        serviceRadius: 10
      },
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        timeSlots: [
          { start: '09:00', end: '17:00', available: true }
        ]
      },
      tags: [],
      requirements: []
    });
    setEditingService(null);
    setShowCreateForm(false);
    setErrors({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
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

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: [
          ...prev.availability.timeSlots,
          { start: '09:00', end: '17:00', available: true }
        ]
      }
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: prev.availability.timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  if (loading) {
    return (
      <div className="service-management">
        <div className="loading">Loading your services...</div>
      </div>
    );
  }

  return (
    <div className="service-management">
      <div className="service-management-header">
        <h2>My Services</h2>
        <div className="header-controls">
          <div className="status-filter">
            <label htmlFor="statusFilter">Show:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | 'all')}
              className="filter-select"
            >
              <option value="active">Active Services</option>
              <option value="inactive">Inactive Services</option>
              <option value="all">All Services</option>
            </select>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Service
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content service-form-modal">
            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-header">
                <h3>{editingService ? 'Edit Service' : 'Create New Service'}</h3>
                <button type="button" onClick={resetForm} className="close-btn">×</button>
              </div>

              <div className="form-group">
                <label htmlFor="title">Service Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Professional Plumbing Repair"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                >
                  <option value="">Select a category</option>
                  {categories && categories.map(cat => (
                    <option key={cat.name} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your service in detail..."
                  rows={4}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="pricing-type">Pricing Type *</label>
                  <select
                    id="pricing-type"
                    value={formData.pricing.type}
                    onChange={(e) => handleInputChange('pricing.type', e.target.value)}
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="negotiable">Negotiable</option>
                  </select>
                </div>

                {formData.pricing.type !== 'negotiable' && (
                  <div className="form-group">
                    <label htmlFor="amount">Amount ($) *</label>
                    <input
                      type="number"
                      id="amount"
                      value={formData.pricing.amount || ''}
                      onChange={(e) => handleInputChange('pricing.amount', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className={errors.amount ? 'error' : ''}
                    />
                    {errors.amount && <span className="error-message">{errors.amount}</span>}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Estimated Duration *</label>
                  <input
                    type="number"
                    id="duration"
                    value={formData.duration.estimated}
                    onChange={(e) => handleInputChange('duration.estimated', parseInt(e.target.value) || 0)}
                    min="15"
                    className={errors.duration ? 'error' : ''}
                  />
                  {errors.duration && <span className="error-message">{errors.duration}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="duration-unit">Duration Unit</label>
                  <select
                    id="duration-unit"
                    value={formData.duration.unit}
                    onChange={(e) => handleInputChange('duration.unit', e.target.value)}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Service Address *</label>
                <div className="address-input-group">
                  <input
                    type="text"
                    id="address"
                    value={formData.location.address}
                    onChange={(e) => handleInputChange('location.address', e.target.value)}
                    placeholder="Enter the address where you provide this service"
                    className={errors.address ? 'error' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const { latitude, longitude } = position.coords;
                            handleInputChange('location.coordinates', [longitude, latitude]);
                            showNotification('Location updated successfully!', 'success');
                          },
                          (error) => {
                            showNotification('Failed to get current location', 'error');
                          }
                        );
                      } else {
                        showNotification('Geolocation is not supported', 'error');
                      }
                    }}
                    className="location-btn"
                  >
                    📍 Use Current Location
                  </button>
                </div>
                {errors.address && <span className="error-message">{errors.address}</span>}
                {errors.coordinates && <span className="error-message">{errors.coordinates}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    value={formData.location.coordinates[1] || ''}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value) || 0;
                      const currentCoords = formData.location.coordinates || [0, 0];
                      handleInputChange('location.coordinates', [currentCoords[0], lat]);
                    }}
                    placeholder="e.g., 40.7128"
                    step="any"
                    min="-90"
                    max="90"
                  />
                  <small>Latitude (-90 to 90)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    value={formData.location.coordinates[0] || ''}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value) || 0;
                      const currentCoords = formData.location.coordinates || [0, 0];
                      handleInputChange('location.coordinates', [lng, currentCoords[1]]);
                    }}
                    placeholder="e.g., -74.0060"
                    step="any"
                    min="-180"
                    max="180"
                  />
                  <small>Longitude (-180 to 180)</small>
                </div>
              </div>

              <div className="coordinates-info">
                <strong>Current Coordinates:</strong>
                <span className="coordinates-display">
                  {formData.location.coordinates[1]?.toFixed(6) || '0'}, {formData.location.coordinates[0]?.toFixed(6) || '0'}
                </span>
                <small>(Latitude, Longitude)</small>
              </div>

              <div className="form-group">
                <label htmlFor="service-radius">Service Radius (km)</label>
                <input
                  type="number"
                  id="service-radius"
                  value={formData.location.serviceRadius || 10}
                  onChange={(e) => handleInputChange('location.serviceRadius', parseInt(e.target.value) || 10)}
                  min="1"
                  max="50"
                />
              </div>

              <div className="form-group">
                <label>Available Days</label>
                <div className="checkbox-group">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.availability.days.includes(day)}
                        onChange={(e) => {
                          const days = formData.availability.days;
                          if (e.target.checked) {
                            handleInputChange('availability.days', [...days, day]);
                          } else {
                            handleInputChange('availability.days', days.filter(d => d !== day));
                          }
                        }}
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Time Slots</label>
                {formData.availability.timeSlots.map((slot, index) => (
                  <div key={index} className="time-slot-row">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) => {
                        const newSlots = [...formData.availability.timeSlots];
                        newSlots[index] = { ...newSlots[index], start: e.target.value };
                        handleInputChange('availability.timeSlots', newSlots);
                      }}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => {
                        const newSlots = [...formData.availability.timeSlots];
                        newSlots[index] = { ...newSlots[index], end: e.target.value };
                        handleInputChange('availability.timeSlots', newSlots);
                      }}
                    />
                    {formData.availability.timeSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="remove-slot-btn"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTimeSlot} className="add-slot-btn">
                  + Add Time Slot
                </button>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="services-grid">
        {(!services || services.length === 0) ? (
          <div className="empty-state">
            <h3>No services yet</h3>
            <p>Create your first service to start receiving bookings!</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create Your First Service
            </button>
          </div>
        ) : (
          services && services.map(service => (
            <div key={service._id} className="service-card my-service">
              <div className="service-card-header">
                <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="service-card-body">
                <h3>{service.title}</h3>
                <p className="category">{service.category}</p>
                <p className="description">{service.description}</p>
                
                <div className="service-details">
                  <div className="detail-item">
                    <span className="label">💰 Price:</span>
                    <span>{serviceService.formatPrice(service.pricing)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">⏱️ Duration:</span>
                    <span>{serviceService.formatDuration(service.duration)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">⭐ Rating:</span>
                    <span>{service.rating.average.toFixed(1)} ({service.rating.count} reviews)</span>
                  </div>
                  {service.metadata && (
                    <div className="detail-item">
                      <span className="label">👀 Views:</span>
                      <span>{service.metadata.views}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="service-card-actions">
                <button 
                  onClick={() => editService(service)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(service._id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceManagement;