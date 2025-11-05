import React, { useState, useEffect } from 'react';
import { userService, serviceService, NearbyProvider } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import ServiceCard from '../services/ServiceCard';
import { useNavigate } from 'react-router-dom';
import './UserSearch.css';

const UserSearch: React.FC = () => {
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [searchType, setSearchType] = useState<'nearby' | 'category'>('nearby');
  const [nearbyProviders, setNearbyProviders] = useState<NearbyProvider[]>([]);
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search parameters
  const [searchParams, setSearchParams] = useState({
    radius: 10,
    category: '',
    lat: 0,
    lng: 0,
    userLocation: ''
  });

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
    getCurrentLocation();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await serviceService.getServiceCategories();
      setCategories(cats.map(c => c.name));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSearchParams(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));
        
        // Reverse geocode to get address (simplified)
        setSearchParams(prev => ({
          ...prev,
          userLocation: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }));

        // Auto-search nearby providers when location is obtained
        searchNearbyProviders(latitude, longitude, searchParams.radius, searchParams.category);
      },
      (error) => {
        setError('Unable to get your location. Please enter coordinates manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const searchNearbyProviders = async (
    lat: number = searchParams.lat,
    lng: number = searchParams.lng,
    radius: number = searchParams.radius,
    category: string = searchParams.category
  ) => {
    if (lat === 0 || lng === 0) {
      setError('Location is required for nearby search');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const providers = await userService.getNearbyProviders({
        lat,
        lng,
        radius,
        category: category || undefined
      });

      setNearbyProviders(providers || []); // Ensure it's always an array
      
      // Get services for each provider
      await loadProviderServices(providers || []);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to search providers');
      setNearbyProviders([]); // Set empty array on error
      setProviderServices([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadProviderServices = async (providers: NearbyProvider[]) => {
    try {
      const servicesPromises = providers.map(async (provider) => {
        try {
          const services = await serviceService.searchServices({
            // Search services by provider (this would need to be implemented in the backend)
            // For now, we'll get all services and filter client-side
            limit: 50
          });
          
          // Filter services by this provider (simplified approach)
          const providerServices = services.services.filter(
            service => service.provider._id === provider._id
          );
          
          return {
            providerId: provider._id,
            services: providerServices
          };
        } catch {
          return {
            providerId: provider._id,
            services: []
          };
        }
      });

      const allServices = await Promise.all(servicesPromises);
      setProviderServices(allServices);
    } catch (error) {
      console.error('Failed to load provider services:', error);
    }
  };

  const handleSearch = () => {
    if (searchType === 'nearby') {
      searchNearbyProviders();
    }
  };

  const getServicesForProvider = (providerId: string) => {
    const providerData = providerServices.find(ps => ps.providerId === providerId);
    return providerData?.services || [];
  };

  const handleBookService = (service: any) => {
    if (!state.user) {
      showNotification('Please log in to book services', 'error');
      navigate('/auth');
      return;
    }

    if (state.user.userType !== 'customer') {
      showNotification('Only customers can book services', 'error');
      return;
    }

    navigate(`/services/${service._id}`);
  };

  const handleViewDetails = (service: any) => {
    navigate(`/services/${service._id}`);
  };

  const handleViewProvider = (provider: NearbyProvider) => {
    navigate(`/providers/${provider._id}`);
  };

  return (
    <div className="user-search">
      <div className="search-header">
        <h1>Find Service Providers</h1>
        <p>Discover trusted professionals in your area</p>
      </div>

      <div className="search-controls">
        <div className="search-type-selector">
          <button
            className={`type-btn ${searchType === 'nearby' ? 'active' : ''}`}
            onClick={() => setSearchType('nearby')}
          >
            📍 Nearby Providers
          </button>
          <button
            className={`type-btn ${searchType === 'category' ? 'active' : ''}`}
            onClick={() => setSearchType('category')}
          >
            🔍 Search by Category
          </button>
        </div>

        {searchType === 'nearby' && (
          <div className="nearby-search">
            <div className="location-info">
              <strong>Your Location:</strong>
              <span className="location-text">
                {searchParams.userLocation || 'Getting location...'}
              </span>
              <button onClick={getCurrentLocation} className="refresh-location">
                🔄 Refresh
              </button>
            </div>

            <div className="search-filters">
              <div className="filter-group">
                <label htmlFor="radius">Search Radius</label>
                <select
                  id="radius"
                  value={searchParams.radius}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, radius: parseInt(e.target.value) }))}
                >
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={20}>20 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="category">Service Category</label>
                <select
                  id="category"
                  value={searchParams.category}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button onClick={handleSearch} className="search-btn">
                🔍 Search Providers
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Searching for providers...</p>
        </div>
      ) : (
        <div className="search-results">
          {searchType === 'nearby' && nearbyProviders && nearbyProviders.length > 0 && (
            <div className="providers-section">
              <h2>Nearby Service Providers ({nearbyProviders.length} found)</h2>
              
              <div className="providers-grid">
                {nearbyProviders.map(provider => (
                  <div key={provider._id} className="provider-card">
                    <div className="provider-header">
                      <div className="provider-info">
                        <div className="provider-avatar">
                          {provider.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3>{provider.name}</h3>
                          <p className="provider-distance">
                            📍 {userService.formatDistance(provider.distance)}
                          </p>
                        </div>
                      </div>
                      <div className="provider-rating">
                        <div className="rating-stars">
                          {userService.getRatingStars(provider.rating.average)}
                        </div>
                        <span className="rating-text">
                          {userService.formatRating(provider.rating)}
                        </span>
                      </div>
                    </div>

                    <div className="provider-details">
                      <div className="provider-categories">
                        <strong>Services:</strong>
                        <div className="categories">
                          {provider.serviceCategories.map((cat, index) => (
                            <span key={index} className="category-badge">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="provider-stats">
                        <span>📅 {provider.experience} years experience</span>
                        <span>📍 {provider.serviceRadius}km service radius</span>
                        {provider.isOnline && (
                          <span className="online-badge">🟢 Online</span>
                        )}
                      </div>

                      {provider.bio && (
                        <p className="provider-bio">{provider.bio}</p>
                      )}
                    </div>

                    <div className="provider-services">
                      <h4>Available Services</h4>
                      <div className="services-list">
                        {getServicesForProvider(provider._id).length > 0 ? (
                          <div className="services-grid-mini">
                            {getServicesForProvider(provider._id).slice(0, 2).map((service: any) => (
                              <div key={service._id} className="mini-service-card">
                                <h5>{service.title}</h5>
                                <p className="service-price">
                                  {serviceService.formatPrice(service.pricing)}
                                </p>
                                <div className="mini-actions">
                                  <button
                                    onClick={() => handleBookService(service)}
                                    className="btn btn-primary btn-sm"
                                  >
                                    Book
                                  </button>
                                  <button
                                    onClick={() => handleViewDetails(service)}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="no-services">No services available</p>
                        )}
                        
                        {getServicesForProvider(provider._id).length > 2 && (
                          <button
                            onClick={() => handleViewProvider(provider)}
                            className="view-all-services"
                          >
                            View all {getServicesForProvider(provider._id).length} services →
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="provider-actions">
                      <button
                        onClick={() => handleViewProvider(provider)}
                        className="btn btn-outline"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nearbyProviders.length === 0 && !loading && searchParams.lat !== 0 && (
            <div className="empty-results">
              <div className="empty-icon">🔍</div>
              <h3>No providers found</h3>
              <p>Try increasing your search radius or changing the category filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;