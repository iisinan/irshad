import React from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    const msg = error?.message || String(error);
    this.setState({ errorMessage: msg });

    // Auto-reload once if dynamic chunk failed due to a new deployment
    if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Loading chunk')) {
      const reloadKey = 'eb_auto_reload_' + window.location.pathname;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.errorMessage?.includes('dynamically imported module') || 
        this.state.errorMessage?.includes('Failed to fetch') ||
        this.state.errorMessage?.includes('Loading chunk');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg, #F8FAFC)',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-section, #FEF2F2)',
            padding: '32px',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.08)',
            border: isChunkError ? '1px solid var(--primary-200, #A7F3D0)' : '1px solid #FCA5A5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: isChunkError ? 'var(--primary, #064E3B)' : '#DC2626' }}>
              {isChunkError ? <Sparkles size={48} /> : <AlertTriangle size={48} />}
            </div>
            <h2 style={{ fontSize: '1.32rem', fontWeight: 800, color: 'var(--text-dark, var(--text-dark))', margin: '0 0 12px 0' }}>
              {isChunkError ? 'New Update Available' : 'Something went wrong'}
            </h2>
            <p style={{ color: 'var(--text-muted, var(--text-muted))', marginBottom: '20px', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {isChunkError
                ? 'A new version of Irshad is available. Refresh to load the latest screening models and features.'
                : "We've encountered an unexpected error. Our team has been notified."}
            </p>
            {this.state.errorMessage && !isChunkError && (
              <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: '#FEE2E2', color: '#7F1D1D', padding: '8px 12px', borderRadius: '6px', marginBottom: '16px', wordBreak: 'break-word', textAlign: 'left' }}>
                {this.state.errorMessage}
              </p>
            )}
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '14px 24px',
                backgroundColor: isChunkError ? 'var(--primary, #064E3B)' : '#DC2626',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <RefreshCw size={18} />
              {isChunkError ? 'Update & Refresh' : 'Reload Application'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
