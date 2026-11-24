import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Menu, AlertCircle, Mail, X, SlidersHorizontal } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import UpdatesInbox from './portfolio/UpdatesInbox';
import LaunchCountdown from './LaunchCountdown';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUnreadCount } from '../services/api';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [unreadInbox, setUnreadInbox] = useState(0);
  const [linkSent, setLinkSent] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchUnreadCount();
      const count = res?.data?.count ?? res?.count ?? 0;
      setUnreadInbox(Number(count) || 0);
    } catch {
      // Keep last known count on transient network failure
    }
  }, [user]);

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 60_000);
    window.addEventListener('focus', refreshUnreadCount);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshUnreadCount);
    };
  }, [refreshUnreadCount]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Open Inbox modal if deep-linked via #inbox
  useEffect(() => {
    if (location.hash === '#inbox') {
      setInboxOpen(true);
    }
  }, [location.hash]);

  // Close Inbox on Escape key
  useEffect(() => {
    if (!inboxOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setInboxOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inboxOpen]);

  // Lock body scroll when mobile menu or Inbox modal is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen || inboxOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, inboxOpen]);

  const badgeLabel = unreadInbox > 9 ? '9+' : String(unreadInbox);

  const renderInboxTrigger = (compact = false) => (
    <button
      type="button"
      onClick={() => setInboxOpen(true)}
      aria-label={unreadInbox > 0 ? `Open Inbox (${unreadInbox} unread)` : 'Open Inbox'}
      title="Inbox"
      style={compact ? {
        position: 'relative',
        background: 'none',
        border: 'none',
        color: 'var(--text-dark)',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        minHeight: 44,
        cursor: 'pointer',
        borderRadius: 10,
      } : {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 14px',
        borderRadius: '999px',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        color: 'var(--text-dark)',
        fontSize: '0.8rem',
        fontWeight: 800,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
      }}
    >
      <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mail size={compact ? 21 : 17} />
        {unreadInbox > 0 && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-7px',
            minWidth: '16px',
            height: '16px',
            padding: '0 4px',
            borderRadius: '999px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: 900,
            lineHeight: '16px',
            textAlign: 'center',
            boxShadow: '0 0 0 2px var(--bg)',
          }}>
            {badgeLabel}
          </span>
        )}
      </span>
      {!compact && <span>Inbox</span>}
    </button>
  );

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
      background: 'var(--body-bg)',
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
            <img src="/favicon.svg" alt="Irshad Logo" style={{
              width: '32px', height: '32px', borderRadius: '8px',
              objectFit: 'cover'
            }} />
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
              Irshad
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {renderInboxTrigger(true)}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--text-dark)', padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, minHeight: 44, cursor: 'pointer', borderRadius: 8
              }}
            >
              <Menu size={22} />
            </button>
          </div>
        </header>

        {/* Desktop Top-Right Utility Bar (Inbox, matching mobile AppBar) */}
        <div
          className="desktop-only-btn"
          style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '18px 24px 0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          {renderInboxTrigger(false)}
        </div>

        {user && !user.email_verified_at && (
          <div style={{
            background: 'var(--non-compliant-bg)',
            color: 'var(--non-compliant)',
            padding: '12px 24px',
            fontSize: '0.79rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--non-compliant-border)'
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
                  color: 'var(--non-compliant)',
                  border: '1px solid var(--non-compliant)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Resend Link
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Verification Link Sent!</span>
            )}
          </div>
        )}

        <LaunchCountdown variant="bar" />

        {children}
      </main>

      {inboxOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notifications Inbox"
          onClick={() => setInboxOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '32px 16px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '780px',
              maxHeight: '86vh',
              background: 'var(--bg)',
              borderRadius: '22px',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.24)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={20} color="var(--primary)" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.3px' }}>
                  Inbox
                </h2>
                {unreadInbox > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: 'var(--primary-50)',
                    color: 'var(--primary)',
                  }}>
                    {unreadInbox} new
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  title="Alert Settings"
                  aria-label="Alert Settings"
                  onClick={() => {
                    setInboxOpen(false);
                    navigate('/portfolio#watchlist');
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-section)',
                    color: 'var(--text-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <SlidersHorizontal size={16} />
                </button>
                <button
                  type="button"
                  title="Close"
                  aria-label="Close Inbox"
                  onClick={() => setInboxOpen(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-section)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ padding: '20px 24px 28px', overflowY: 'auto', flex: 1 }}>
              <UpdatesInbox onUnreadCountChanged={setUnreadInbox} hideTitle={true} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
