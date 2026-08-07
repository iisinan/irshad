import React, { useState, useEffect } from 'react';
import { Menu, AlertCircle } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Wait for auth to resolve before making routing decisions
  if (loading) return null;

  // Unauthenticated users must log in first
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(15,82,87,0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(212,175,55,0.04) 0px, transparent 50%)',
    }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 990,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      <DashboardSidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <main className="dashboard-main-content">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="mobile-dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--gold-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.7rem', color: 'white',
            }}>إ</div>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
              Irshad
            </span>
          </div>
          <button 
            onClick={() => setMobileOpen(true)}
            style={{ 
              background: 'none', border: 'none', 
              color: 'var(--text-dark)', padding: '4px' 
            }}
          >
            <Menu size={24} />
          </button>
        </header>

        {user && !user.email_verified_at && (
          <div style={{
            background: 'var(--non-halal-bg)',
            color: 'var(--non-halal)',
            padding: '12px 24px',
            fontSize: '0.79rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #fecaca'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>Please verify your email address to unlock all features.</span>
            </div>
            {!linkSent ? (
              <button
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  btn.disabled = true;
                  btn.textContent = 'Sending...';
                  try {
                    const { resendVerification } = await import('../services/api');
                    await resendVerification();
                    setLinkSent(true);
                  } catch(err) {
                    console.error(err);
                    btn.textContent = 'Failed. Try Again';
                    btn.disabled = false;
                  }
                }}
                style={{
                  background: 'var(--bg)',
                  color: 'var(--non-halal)',
                  border: '1px solid var(--non-halal)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Resend Link
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Verification Link Sent!</span>
            )}
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
