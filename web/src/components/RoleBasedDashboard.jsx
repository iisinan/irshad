import React from 'react';
import { useAuth } from '../context/AuthContext';
import Portfolio from './Portfolio';
import ConsumerDashboard from './ConsumerDashboard';

export default function RoleBasedDashboard() {
  const { user } = useAuth();

  const renderDashboard = () => {
    if (user?.role === 'consumer') {
      return <ConsumerDashboard />;
    }
    return <Portfolio />;
  };

  return (
    <>
      {renderDashboard()}
    </>
  );
}
