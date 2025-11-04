import apiClient, { PaginatedResponse } from './api';
import { mockServices, isDemoMode } from './demoData';

export interface ServiceLocation {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  serviceRadius?: number;
}

export interface ServicePricing {
  type: 'fixed' | 'hourly' | 'negotiable';
  amount?: number;
  currency: string;
  unit?: string;
}

export interface ServiceDuration {
  estimated: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface ServiceAvailability {
  days: string[];
  timeSlots: Array<{
    start: string; // HH:MM format
    end: string;   // HH:MM format
    available: boolean;
  }>;
}

export interface ServiceProvider {
  _id: string;
  name: string;
  rating: {
    average: number;
    count: number;
  };
  experience?: number;
  bio?: string;
}

export interface ServiceRating {
  average: number;
  count: number;
}

export interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  provider: ServiceProvider;
  pricing: ServicePricing;
  duration: ServiceDuration;
  location: ServiceLocation;
  availability: ServiceAvailability;
  tags: string[];
  requirements: string[];
  rating: ServiceRating;
  distance?: number; // km (if location search used)
  isActive: boolean;
  metadata?: {
    views: number;
    inquiries: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSearchParams {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'distance' | 'price' | 'rating' | 'newest' | 'popularity';
  page?: number;
  limit?: number;
}

export interface CreateServiceData {
  title: string;
  description: string;
  category: string;
  pricing: ServicePricing;
  duration: ServiceDuration;
  location: ServiceLocation;
  availability: ServiceAvailability;
  tags?: string[];
  requirements?: string[];
}

export interface UpdateServiceData extends Partial<CreateServiceData> {}

export interface ServiceCategory {
  name: string;
  count: number;
}

export interface ServiceSearchResponse {
  message: string;
  services: Service[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalServices: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MyServicesParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive';
}

class ServiceService {
  async searchServices(params: ServiceSearchParams): Promise<ServiceSearchResponse> {
    if (isDemoMode()) {
      // Return demo data for showcase
      return {
        message: 'Demo services retrieved successfully',
        services: mockServices,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalServices: mockServices.length,
          hasNext: false,
          hasPrev: false
        }
      };
    }
    
    const response = await apiClient.get<ServiceSearchResponse>('/services', { params });
    return response.data;
  }

  async getServiceById(id: string): Promise<Service> {
    const response = await apiClient.get<{ message: string; service: Service }>(`/services/${id}`);
    return response.data.service;
  }

  async getServiceCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get<{ message: string; categories: ServiceCategory[] }>('/services/categories');
    return response.data.categories;
  }

  async createService(data: CreateServiceData): Promise<Service> {
    const response = await apiClient.post<{ message: string; service: Service }>('/services', data);
    return response.data.service;
  }

  async updateService(id: string, data: UpdateServiceData): Promise<Service> {
    const response = await apiClient.put<{ message: string; service: Service }>(`/services/${id}`, data);
    return response.data.service;
  }

  async deleteService(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
  }

  async getMyServices(params: MyServicesParams = {}): Promise<PaginatedResponse<Service>> {
    const response = await apiClient.get<{
      message: string;
      services: Service[];
      pagination: PaginatedResponse<Service>['pagination'];
    }>('/services/provider/my-services', { params });
    
    return {
      data: response.data.services,
      pagination: response.data.pagination
    };
  }

  // Utility methods
  formatPrice(pricing: ServicePricing): string {
    if (pricing.type === 'negotiable') {
      return 'Negotiable';
    }
    
    const amount = pricing.amount || 0;
    const currency = pricing.currency === 'USD' ? '$' : pricing.currency;
    const unit = pricing.unit || 'job';
    
    if (pricing.type === 'hourly') {
      return `${currency}${amount}/hour`;
    }
    
    return `${currency}${amount}/${unit}`;
  }

  formatDuration(duration: ServiceDuration): string {
    const { estimated, unit } = duration;
    
    if (unit === 'minutes') {
      if (estimated >= 60) {
        const hours = Math.floor(estimated / 60);
        const mins = estimated % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
      return `${estimated}m`;
    }
    
    if (unit === 'hours') {
      return estimated === 1 ? '1 hour' : `${estimated} hours`;
    }
    
    return estimated === 1 ? '1 day' : `${estimated} days`;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

export default new ServiceService();