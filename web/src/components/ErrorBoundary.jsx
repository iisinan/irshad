import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
            backgroundColor: '#FEF2F2',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '480px',
            boxShadow: '0 4px 20px rgba(220, 38, 38, 0.1)',
            border: '1px solid #FCA5A5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#DC2626' }}>
              <AlertTriangle size={48} />
            </div>
            <h2 style={{ fontSize: '1.32rem', color: '#991B1B', margin: '0 0 12px 0' }}>Something went wrong</h2>
            <p style={{ color: '#B91C1C', marginBottom: '24px', lineHeight: 1.5 }}>
              We've encountered an unexpected error. Our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto',
                padding: '12px 24px',
                backgroundColor: '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#B91C1C'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#DC2626'}
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
