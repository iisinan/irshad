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
      backgroundColor: 'var(--body-bg)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'var(--bg)',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '480px',
        boxShadow: '0 4px 25px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border)'
      }}>
        <h1 style={{ fontSize: '3.52rem', fontWeight: 800, color: 'var(--primary)', margin: '0 0 8px 0', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontSize: '1.32rem', color: 'var(--text-dark)', margin: '0 0 16px 0' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
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
              padding: '14px 24px',
              backgroundColor: 'var(--primary)',
              color: 'var(--text-dark)',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(209, 165, 98, 0.25)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-hover)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
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
            onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--body-bg)'; e.target.style.color = 'var(--text-dark)'; }}
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
