import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '480px',
        boxShadow: '0 4px 25px rgba(15, 82, 87, 0.05)',
        border: '1px solid #E2E8F0'
      }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#0F5257', margin: '0 0 8px 0', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.5rem', color: '#1E293B', margin: '0 0 16px 0' }}>Page Not Found</h2>
        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => navigate('/portfolio')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#0F5257',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#0A3B3E'; e.target.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = '#0F5257'; e.target.style.transform = 'translateY(0)'; }}
          >
            <Home size={18} />
            Go to Portfolio
          </button>
          
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#475569',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#F1F5F9'; e.target.style.color = '#1E293B'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#475569'; }}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
