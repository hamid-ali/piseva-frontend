import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { socketService } from '../services';

interface Notification {
  id: string;
  type: 'booking_request' | 'booking_update' | 'message' | 'activity' | 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_CONNECTED'; payload: boolean };

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isConnected: false,
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications].slice(0, 50); // Keep max 50
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: state.unreadCount + (action.payload.read ? 0 : 1),
      };
    case 'MARK_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const unreadAfterMark = updatedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: unreadAfterMark,
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'REMOVE_NOTIFICATION':
      const filtered = state.notifications.filter(n => n.id !== action.payload);
      return {
        ...state,
        notifications: filtered,
        unreadCount: filtered.filter(n => !n.read).length,
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: action.payload,
      };
    default:
      return state;
  }
};

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  useEffect(() => {
    // Set up socket event listeners
    const handleNewBookingRequest = (data: any) => {
      addNotification({
        type: 'booking_request',
        title: 'New Booking Request',
        message: data.message || 'You have a new booking request',
        data: data.booking
      });
    };

    const handleBookingStatusUpdate = (data: any) => {
      addNotification({
        type: 'booking_update',
        title: 'Booking Update',
        message: data.message || 'Your booking status has been updated',
        data: data
      });
    };

    const handleNewMessage = (data: any) => {
      addNotification({
        type: 'message',
        title: 'New Message',
        message: data.message || 'You have a new message',
        data: data
      });
    };

    const handleBookingActivity = (data: any) => {
      addNotification({
        type: 'activity',
        title: 'Booking Activity',
        message: data.message || 'There\'s new activity in your area',
        data: data
      });
    };

    // Add socket listeners
    socketService.onNewBookingRequest(handleNewBookingRequest);
    socketService.onBookingStatusUpdate(handleBookingStatusUpdate);
    socketService.onNewMessage(handleNewMessage);
    socketService.onBookingActivity(handleBookingActivity);

    // Check connection status
    const checkConnection = () => {
      dispatch({ type: 'SET_CONNECTED', payload: socketService.isSocketConnected() });
    };

    const connectionInterval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    // Cleanup
    return () => {
      clearInterval(connectionInterval);
      socketService.offNewBookingRequest();
      socketService.offBookingStatusUpdate();
      socketService.offNewMessage();
      socketService.offBookingActivity();
    };
  }, []);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_READ' });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    addNotification({ title, message, type });
  };

  const contextValue: NotificationContextType = {
    state,
    addNotification,
    showNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};