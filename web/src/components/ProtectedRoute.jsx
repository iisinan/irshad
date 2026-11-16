import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly, institutionOnly }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to={user.role === 'institution' ? '/institution' : '/portfolio'} replace />;
  }

  if (institutionOnly && !['institution', 'admin'].includes(user.role)) {
    return <Navigate to="/portfolio" replace />;
  }

  return children;
};

export default ProtectedRoute;
