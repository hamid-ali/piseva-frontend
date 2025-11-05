import { io, Socket } from 'socket.io-client';
import authService from './authService';

export interface SocketNotification {
  type: 'booking_request' | 'booking_update' | 'message' | 'activity';
  bookingId?: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface JoinRoomData {
  userType: 'customer' | 'provider';
  userId: string;
  location?: { lat: number; lng: number };
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    if (!token || !user) {
      console.warn('Cannot connect to socket: No authentication token or user data');
      return;
    }

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://undetectably-multidigitate-paulette.ngrok-free.dev';
    
    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
      forceNew: true,
      path: '/socket.io/'
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user-specific rooms
      this.joinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  private joinRooms(): void {
    const user = authService.getCurrentUser();
    if (!user || !this.socket) return;

    const joinData: JoinRoomData = {
      userType: user.userType,
      userId: user._id
    };

    // Add location if available
    if (user.location?.coordinates) {
      joinData.location = {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0]
      };
    }

    this.socket.emit('join', joinData);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event listeners
  onNewBookingRequest(callback: (data: any) => void): void {
    this.socket?.on('new_booking_request', callback);
  }

  onBookingStatusUpdate(callback: (data: any) => void): void {
    this.socket?.on('booking_status_update', callback);
  }

  onNewMessage(callback: (data: any) => void): void {
    this.socket?.on('new_message', callback);
  }

  onBookingActivity(callback: (data: any) => void): void {
    this.socket?.on('booking_activity', callback);
  }

  // Remove event listeners
  offNewBookingRequest(): void {
    this.socket?.off('new_booking_request');
  }

  offBookingStatusUpdate(): void {
    this.socket?.off('booking_status_update');
  }

  offNewMessage(): void {
    this.socket?.off('new_message');
  }

  offBookingActivity(): void {
    this.socket?.off('booking_activity');
  }

  // Emit events
  emitBookingUpdate(data: {
    bookingId: string;
    customerId: string;
    providerId: string;
    status: string;
  }): void {
    this.socket?.emit('booking_update', data);
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Auto-connect when user logs in
  initialize(): void {
    if (authService.isAuthenticated()) {
      this.connect();
    }
  }

  // Clean up when user logs out
  cleanup(): void {
    this.disconnect();
  }
}

export default new SocketService();