import React, { useState, useEffect } from 'react';
import { Menu, X, AlertCircle } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardTour from './DashboardTour';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  
  // Initialize tour visibility once per mount. 
  // It won't hide immediately if user context updates to onboarded=true during the tour.
  const [showTour, setShowTour] = useState(() => !user?.preferences?.onboarded);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  if (user && !user.email_verified_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(at 0% 0%, rgba(15,82,87,0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(212,175,55,0.04) 0px, transparent 50%)',
    }}>
      {showTour && <DashboardTour onClose={() => setShowTour(false)} />}

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
      
      <main style={{
        flex: 1,
        overflowX: 'hidden',
        minWidth: 0,
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="mobile-dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--gold-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.8rem', color: 'white',
            }}>إ</div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
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
            fontSize: '0.9rem',
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
            <button
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.textContent = 'Sending...';
                try {
                  const { resendVerification } = await import('../services/api');
                  await resendVerification();
                  btn.textContent = 'Verification Link Sent!';
                } catch(err) {
                  btn.textContent = 'Failed. Try Again';
                  btn.disabled = false;
                }
              }}
              style={{
                background: 'white',
                color: 'var(--non-halal)',
                border: '1px solid var(--non-halal)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Resend Link
            </button>
          </div>
        )}

        {children}
      </main>
    </div>
  );
}
