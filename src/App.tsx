import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AuthGuard from './components/auth/AuthGuard';
import Layout from './components/layout/Layout';
import Dashboard from './components/layout/Dashboard';
import ServiceBrowser from './components/services/ServiceBrowser';
import ServiceDetails from './components/services/ServiceDetails';
import ServiceManagement from './components/services/ServiceManagement';
import BookingHistory from './components/bookings/BookingHistory';
import BookingDetails from './components/bookings/BookingDetails';
import ProfileSettings from './components/profile/ProfileSettings';
import UserSearch from './components/users/UserSearch';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/auth" element={<AuthGuard />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/services" element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceBrowser />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <Layout>
                    <BookingHistory />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/my-services" element={
                <ProtectedRoute requiredUserType="provider">
                  <Layout>
                    <ServiceManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <ProfileSettings />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/booking/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <BookingDetails />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/services/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceDetails />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <Layout>
                    <UserSearch />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
