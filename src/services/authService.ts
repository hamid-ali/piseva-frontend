import apiClient, { ApiResponse } from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  userType: 'customer' | 'provider';
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  serviceCategories?: string[];
  serviceRadius?: number;
  experience?: number;
  bio?: string;
  rating?: {
    average: number;
    count: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  userType: 'customer' | 'provider';
  location: {
    coordinates: [number, number];
    address: string;
  };
  serviceCategories?: string[];
  serviceRadius?: number;
  experience?: number;
  bio?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  location?: {
    coordinates: [number, number];
    address: string;
  };
  serviceCategories?: string[];
  serviceRadius?: number;
  experience?: number;
  bio?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    // Store token and user data
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ message: string; user: User }>('/auth/profile');
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data.user;
  }

  async updateProfile(data: UpdateProfileData): Promise<User> {
    const response = await apiClient.put<{ message: string; user: User }>('/auth/profile', data);
    
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data.user;
  }

  async changePassword(data: ChangePasswordData): Promise<void> {
    await apiClient.put<ApiResponse<null>>('/auth/password', data);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isProvider(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'provider';
  }

  isCustomer(): boolean {
    const user = this.getCurrentUser();
    return user?.userType === 'customer';
  }
}

export default new AuthService();