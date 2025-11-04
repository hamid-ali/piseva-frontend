// Services exports
export { default as authService } from './authService';
export { default as serviceService } from './serviceService';
export { default as bookingService } from './bookingService';
export { default as userService } from './userService';
export { default as socketService } from './socketService';
export { default as apiClient } from './api';

// Type exports
export type { User, LoginData, RegisterData, AuthResponse, UpdateProfileData, ChangePasswordData } from './authService';
export type { Service, ServiceSearchParams, CreateServiceData, ServiceCategory } from './serviceService';
export type { Booking, CreateBookingData, BookingSearchParams, BookingStats, BookingMessage, BookingRating } from './bookingService';
export type { NearbyProvider, ProviderProfile } from './userService';
export type { ApiError, ApiResponse, PaginatedResponse } from './api';