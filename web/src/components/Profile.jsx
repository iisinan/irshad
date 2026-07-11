import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Shield, CreditCard, Bell, ChevronRight, LogOut, Settings, HelpCircle, ExternalLink } from 'lucide-react';

const ProfileMenuItem = ({ icon: Icon, title, description, onClick, danger }) => (
  <button 
    onClick={onClick}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      background: 'white',
      padding: '20px 24px',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'var(--transition)',
      textAlign: 'left'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = danger ? 'var(--non-halal)' : 'var(--primary)';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{ 
      width: '48px', 
      height: '48px', 
      borderRadius: '12px', 
      background: danger ? 'var(--non-halal-bg)' : 'var(--primary-50)', 
      color: danger ? 'var(--non-halal)' : 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={22} />
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: danger ? 'var(--non-halal)' : 'var(--text-dark)', marginBottom: '4px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{description}</p>
    </div>
    <ChevronRight size={20} color="var(--text-light)" />
  </button>
);

export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const initials = (user?.first_name || user?.name || 'U').charAt(0).toUpperCase();

  return (
    <div className="page-wrapper" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          background: 'var(--gold-grad)',
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 12px 32px rgba(201,168,76,0.3)',
          border: '4px solid white'
        }}>
          {initials}
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {user.first_name} {user.last_name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '0.95rem' }}>{user.email}</span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-strong)' }}></span>
          <span className="status-badge status-halal" style={{ fontSize: '0.65rem' }}>Verified</span>
        </div>
      </div>

      {/* Main Menu Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-dark)', paddingLeft: '8px' }}>Account Settings</h2>
          
          <ProfileMenuItem 
            icon={User}
            title="Personal Information"
            description="Update your name, email, and phone number"
            onClick={() => alert('Editing personal info')}
          />
          
          <ProfileMenuItem 
            icon={Shield}
            title="Security & Password"
            description="Change password and enable two-factor authentication"
            onClick={() => alert('Security settings')}
          />
          
          <ProfileMenuItem 
            icon={CreditCard}
            title="Brokerage Connection"
            description="Link your stock broker to enable in-app trading"
            onClick={() => alert('Connect broker')}
          />
          
          <ProfileMenuItem 
            icon={Bell}
            title="Notifications"
            description="Manage alerts for price changes and halal compliance"
            onClick={() => alert('Notification settings')}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-dark)', paddingLeft: '8px' }}>Support & Legal</h2>
          
          <ProfileMenuItem 
            icon={HelpCircle}
            title="Help Center"
            description="Get help with your account and portfolio"
            onClick={() => alert('Help Center')}
          />
          
          <ProfileMenuItem 
            icon={ExternalLink}
            title="Shariah Methodology"
            description="Read about our screening process"
            onClick={() => window.location.href = '/shariah'}
          />
        </div>

        <div>
          <ProfileMenuItem 
            icon={LogOut}
            title="Log Out"
            description="Sign out of your Irshad account on this device"
            onClick={logout}
            danger={true}
          />
        </div>
      </div>
      
    </div>
  );
}
