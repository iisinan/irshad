import React from 'react';
import { useAuth } from '../context/AuthContext';
import Portfolio from './Portfolio';
import ConsumerDashboard from './ConsumerDashboard';

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  
  // Default to investor if no role is explicitly set yet, 
  // or handle strictly if you enforce role setting.
  if (user?.role === 'investor' || !user?.role) {
    return <Portfolio />;
  }
  
  return <ConsumerDashboard />;
}
