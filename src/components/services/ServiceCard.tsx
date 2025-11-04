import React from 'react';
import { Service, serviceService } from '../../services';
import './Services.css';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
  onViewDetails?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBook, onViewDetails }) => {
  const handleBookClick = () => {
    onBook(service);
  };

  const handleDetailsClick = () => {
    if (onViewDetails) {
      onViewDetails(service);
    }
  };

  return (
    <div className="service-card">
      <div className="service-header">
        <div className="service-category">
          {service.category}
        </div>
        {service.distance && (
          <div className="service-distance">
            {service.distance.toFixed(1)}km away
          </div>
        )}
      </div>

      <div className="service-content">
        <h3 className="service-title">{service.title}</h3>
        
        <div className="service-provider">
          <span className="provider-name">👤 {service.provider.name}</span>
          {service.provider.rating.count > 0 && (
            <div className="provider-rating">
              ⭐ {service.provider.rating.average.toFixed(1)} 
              ({service.provider.rating.count})
            </div>
          )}
        </div>

        <p className="service-description">
          {service.description.length > 120 
            ? service.description.substring(0, 120) + '...'
            : service.description}
        </p>

        <div className="service-details">
          <div className="service-pricing">
            💰 {serviceService.formatPrice(service.pricing)}
          </div>
          
          <div className="service-duration">
            ⏱️ {serviceService.formatDuration(service.duration)}
          </div>
        </div>

        {service.tags.length > 0 && (
          <div className="service-tags">
            {service.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="service-tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="service-location">
          📍 {service.location.address}
        </div>
      </div>

      <div className="service-actions">
        <button 
          className="book-button"
          onClick={handleBookClick}
          disabled={!service.isActive}
        >
          {service.isActive ? 'Book Now' : 'Unavailable'}
        </button>
        
        <button 
          className="details-button"
          onClick={handleDetailsClick}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;