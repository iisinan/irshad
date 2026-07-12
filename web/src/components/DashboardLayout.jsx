import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import DashboardSidebar from './DashboardSidebar';
import { useLocation } from 'react-router-dom';

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
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

        {children}
      </main>
    </div>
  );
}
