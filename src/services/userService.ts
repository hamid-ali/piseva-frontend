import apiClient from './api';
import { User } from './authService';

export interface NearbyProvider {
  _id: string;
  name: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  serviceCategories: string[];
  serviceRadius: number;
  experience: number;
  bio?: string;
  rating: {
    average: number;
    count: number;
  };
  distance: number; // km
  isOnline?: boolean;
}

export interface ProviderProfile extends User {
  services?: Array<{
    _id: string;
    title: string;
    category: string;
    rating: {
      average: number;
      count: number;
    };
  }>;
  reviews?: Array<{
    _id: string;
    reviewer: {
      name: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

export interface NearbyProvidersParams {
  lat: number;
  lng: number;
  radius?: number;
  category?: string;
}

export interface UserSearchParams {
  userType?: 'customer' | 'provider';
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResponse {
  message: string;
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class UserService {
  async getNearbyProviders(params: NearbyProvidersParams): Promise<NearbyProvider[]> {
    const response = await apiClient.get<{
      message: string;
      providers: NearbyProvider[];
    }>('/users/providers/nearby', { params });
    
    return response.data.providers;
  }

  async getProviderProfile(id: string): Promise<ProviderProfile> {
    const response = await apiClient.get<{
      message: string;
      provider: ProviderProfile;
    }>(`/users/providers/${id}`);
    
    return response.data.provider;
  }

  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    const response = await apiClient.get<UserSearchResponse>('/users/search', { params });
    return response.data;
  }

  // Utility methods
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

  formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  formatRating(rating: { average: number; count: number }): string {
    if (rating.count === 0) {
      return 'No ratings yet';
    }
    
    return `${rating.average.toFixed(1)} (${rating.count} review${rating.count === 1 ? '' : 's'})`;
  }
}

export default new UserService();