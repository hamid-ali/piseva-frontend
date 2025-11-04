import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthPage from './AuthPage';

const AuthGuard: React.FC = () => {
  const { state } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, show auth page
  return <AuthPage />;
};

export default AuthGuard;