import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple protected route component that redirects to login if user is not authenticated
const ProtectedRoute = ({ children }) => {
  // Check if user is logged in by looking for token in localStorage
  const isAuthenticated = localStorage.getItem('token') !== null;
  
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated, render the children components
  return children;
};

export default ProtectedRoute; 