import apiClient, { PaginatedResponse } from './api';

export interface BookingLocation {
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  additionalInfo?: string;
}

export interface BookingTimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface BookingPricing {
  quotedAmount: number;
  finalAmount?: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

export interface BookingTimeline {
  requestedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface BookingParticipant {
  _id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface BookingServiceInfo {
  _id: string;
  title: string;
  category: string;
  pricing: {
    type: string;
    amount: number;
    currency: string;
  };
}

export interface BookingMessage {
  _id: string;
  sender: BookingParticipant;
  message: string;
  timestamp: string;
}

export interface BookingRating {
  _id: string;
  rater: BookingParticipant;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}

export interface Booking {
  _id: string;
  customer: BookingParticipant;
  provider: BookingParticipant;
  service: BookingServiceInfo;
  status: 'pending' | 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled' | 'disputed';
  scheduledDate: string; // ISO date string
  scheduledTime: BookingTimeSlot;
  location: BookingLocation;
  pricing: BookingPricing;
  timeline: BookingTimeline;
  customerRequirements?: string;
  messages?: BookingMessage[];
  ratings?: BookingRating[];
  metadata?: {
    distanceKm: number;
    estimatedDuration: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  service: string; // service ID
  provider: string; // provider ID
  scheduledDate: string; // ISO date string
  scheduledTime: BookingTimeSlot;
  location: BookingLocation;
  customerRequirements?: string;
  pricing: {
    quotedAmount: number;
  };
}

export interface BookingSearchParams {
  status?: 'pending' | 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled' | 'disputed';
  page?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'scheduled' | 'status';
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}

export interface UpdateBookingStatusData {
  status: 'accepted' | 'rejected' | 'in-progress' | 'completed' | 'cancelled' | 'disputed';
  reason?: string;
}

export interface BookingMessageData {
  message: string;
}

export interface BookingRatingData {
  rating: number; // 1-5
  comment?: string;
}

export interface BookingStats {
  total: number;
  byStatus: Array<{
    _id: string;
    count: number;
    totalAmount: number;
  }>;
  recent: Booking[];
}

export interface BookingsResponse {
  message: string;
  bookings: Booking[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalBookings: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class BookingService {
  async getBookings(params: BookingSearchParams = {}): Promise<BookingsResponse> {
    const response = await apiClient.get<BookingsResponse>('/bookings', { params });
    return response.data;
  }

  async getBookingById(id: string): Promise<Booking> {
    const response = await apiClient.get<{ message: string; booking: Booking }>(`/bookings/${id}`);
    return response.data.booking;
  }

  async createBooking(data: CreateBookingData): Promise<Booking> {
    const response = await apiClient.post<{ message: string; booking: Booking }>('/bookings', data);
    return response.data.booking;
  }

  async updateBookingStatus(id: string, data: UpdateBookingStatusData): Promise<Booking> {
    const response = await apiClient.put<{ message: string; booking: Booking }>(`/bookings/${id}/status`, data);
    return response.data.booking;
  }

  async addMessage(id: string, data: BookingMessageData): Promise<BookingMessage> {
    const response = await apiClient.post<{ message: string; messageData: BookingMessage }>(`/bookings/${id}/message`, data);
    return response.data.messageData;
  }

  async addRating(id: string, data: BookingRatingData): Promise<BookingRating> {
    const response = await apiClient.post<{ message: string; rating: BookingRating }>(`/bookings/${id}/rating`, data);
    return response.data.rating;
  }

  async getBookingStats(): Promise<BookingStats> {
    const response = await apiClient.get<{ message: string; stats: BookingStats }>('/bookings/stats');
    return response.data.stats;
  }

  async getUserBookings(): Promise<Booking[]> {
    const response = await this.getBookings();
    return response.bookings;
  }

  async cancelBooking(id: string): Promise<Booking> {
    return this.updateBookingStatus(id, { status: 'cancelled', reason: 'Cancelled by user' });
  }

  // Utility methods
  getStatusColor(status: Booking['status']): string {
    const statusColors: Record<Booking['status'], string> = {
      pending: '#f59e0b',      // amber
      accepted: '#3b82f6',     // blue
      rejected: '#ef4444',     // red
      'in-progress': '#8b5cf6', // purple
      completed: '#10b981',    // green
      cancelled: '#6b7280',    // gray
      disputed: '#dc2626'      // dark red
    };
    return statusColors[status] || '#6b7280';
  }

  getStatusLabel(status: Booking['status']): string {
    const statusLabels: Record<Booking['status'], string> = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      'in-progress': 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      disputed: 'Disputed'
    };
    return statusLabels[status] || status;
  }

  canUpdateStatus(currentStatus: Booking['status'], newStatus: Booking['status'], userType: 'customer' | 'provider'): boolean {
    const transitions: Record<Booking['status'], Booking['status'][]> = {
      pending: ['accepted', 'rejected', 'cancelled'],
      accepted: ['in-progress', 'cancelled', 'disputed'],
      rejected: [],
      'in-progress': ['completed', 'cancelled', 'disputed'],
      completed: ['disputed'],
      cancelled: [],
      disputed: []
    };

    if (!transitions[currentStatus].includes(newStatus)) {
      return false;
    }

    // Provider can accept/reject, customer can cancel
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      return userType === 'provider';
    }

    if (newStatus === 'cancelled' && currentStatus === 'pending') {
      return userType === 'customer';
    }

    return true;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  formatTimeSlot(timeSlot: BookingTimeSlot): string {
    return `${this.formatTime(timeSlot.start)} - ${this.formatTime(timeSlot.end)}`;
  }

  isUpcoming(booking: Booking): boolean {
    const scheduledDateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime.start}`);
    return scheduledDateTime > new Date();
  }

  isPast(booking: Booking): boolean {
    return !this.isUpcoming(booking);
  }
}

export default new BookingService();