import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceService, Service, ServiceSearchParams } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import ServiceCard from './ServiceCard';
import ServiceFilters from './ServiceFilters';
import BookingForm from '../bookings/BookingForm';
import './Services.css';

const ServiceBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { showNotification } = useNotifications();
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [searchParams, setSearchParams] = useState<ServiceSearchParams>({
    page: 1,
    limit: 12,
    sortBy: 'distance'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalServices: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadServices();
  }, [searchParams]);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await serviceService.searchServices(searchParams);
      setServices(response.services);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newParams: Partial<ServiceSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: 1 // Reset to first page on new search
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookService = (service: Service) => {
    if (!state.user) {
      showNotification('Please log in to book services', 'error');
      navigate('/auth');
      return;
    }

    if (state.user.userType !== 'customer') {
      showNotification('Only customers can book services', 'error');
      return;
    }

    setSelectedService(service);
    setShowBookingForm(true);
  };

  const handleBookingCreated = () => {
    setShowBookingForm(false);
    setSelectedService(null);
    showNotification('Booking request sent successfully!', 'success');
    navigate('/bookings');
  };

  const handleViewDetails = (service: Service) => {
    navigate(`/services/${service._id}`);
  };

  return (
    <div className="service-browser">
      <div className="browser-header">
        <h1>Find Local Services</h1>
        <p>Discover trusted service providers in your area</p>
      </div>

      <ServiceFilters 
        onSearch={handleSearch}
        currentParams={searchParams}
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching for services...</p>
        </div>
      ) : (
        <>
          <div className="search-results-header">
            <span className="results-count">
              {pagination.totalServices} service{pagination.totalServices !== 1 ? 's' : ''} found
            </span>
          </div>

          {services.length > 0 ? (
            <>
              <div className="services-grid">
                {services.map(service => (
                  <ServiceCard 
                    key={service._id} 
                    service={service}
                    onBook={handleBookService}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    ← Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    className="pagination-button"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-results">
              <div className="empty-state-icon">🔍</div>
              <h3>No services found</h3>
              <p>Try adjusting your search criteria or location</p>
            </div>
          )}
        </>
      )}

      {showBookingForm && selectedService && (
        <div className="modal-overlay">
          <div className="modal-content">
            <BookingForm
              service={selectedService}
              onBookingCreated={handleBookingCreated}
              onCancel={() => {
                setShowBookingForm(false);
                setSelectedService(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceBrowser;