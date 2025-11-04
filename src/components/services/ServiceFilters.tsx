import React, { useState, useEffect } from 'react';
import { ServiceSearchParams, serviceService } from '../../services';
import { ServiceCategory } from '../../services/serviceService';
import './Services.css';

interface ServiceFiltersProps {
  onSearch: (params: Partial<ServiceSearchParams>) => void;
  currentParams: ServiceSearchParams;
}

const ServiceFilters: React.FC<ServiceFiltersProps> = ({ onSearch, currentParams }) => {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [filters, setFilters] = useState({
    search: currentParams.search || '',
    category: currentParams.category || '',
    minPrice: currentParams.minPrice || '',
    maxPrice: currentParams.maxPrice || '',
    radius: currentParams.radius || 10,
    sortBy: currentParams.sortBy || 'distance'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await serviceService.getServiceCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Build search params
    const searchParams: Partial<ServiceSearchParams> = {};
    
    if (newFilters.search) searchParams.search = newFilters.search;
    if (newFilters.category) searchParams.category = newFilters.category;
    if (newFilters.minPrice) searchParams.minPrice = Number(newFilters.minPrice);
    if (newFilters.maxPrice) searchParams.maxPrice = Number(newFilters.maxPrice);
    if (newFilters.radius) searchParams.radius = Number(newFilters.radius);
    if (newFilters.sortBy) searchParams.sortBy = newFilters.sortBy as any;

    onSearch(searchParams);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      radius: 10,
      sortBy: 'distance' as const
    };
    setFilters(clearedFilters);
    onSearch({ sortBy: 'distance', radius: 10 });
  };

  return (
    <div className="service-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="search">Search Services</label>
          <input
            id="search"
            type="text"
            placeholder="What service are you looking for?"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="radius">Radius (km)</label>
          <select
            id="radius"
            value={filters.radius}
            onChange={(e) => handleFilterChange('radius', Number(e.target.value))}
            className="filter-select"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="minPrice">Min Price ($)</label>
          <input
            id="minPrice"
            type="number"
            placeholder="0"
            min="0"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
            className="price-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="maxPrice">Max Price ($)</label>
          <input
            id="maxPrice"
            type="number"
            placeholder="1000"
            min="0"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
            className="price-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sortBy">Sort By</label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
          >
            <option value="distance">Distance</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>

        <div className="filter-actions">
          <button 
            className="clear-filters-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceFilters;