import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ConsumerDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="animate-fade-in" style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '1.58rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
        Welcome, {user?.first_name || user?.name || 'Consumer'}
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>This is your consumer-focused dashboard.</p>
      
      <div style={{ marginTop: '24px', background: 'var(--bg)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.06rem', fontWeight: 700, marginBottom: '16px' }}>Your Recent Activity</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '0.79rem' }}>You haven't scanned any products recently.</p>
      </div>
    </div>
  );
}
