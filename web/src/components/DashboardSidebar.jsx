import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart2, Activity,
  HeartHandshake, Calculator, BookOpen,
  User, LogOut, ChevronLeft, ChevronRight,
  X, Moon, Sun, Shield, FileText, Bell, HelpCircle, Star
} from 'lucide-react';

export default function DashboardSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const NAV_ITEMS = [
    { section: 'Main' },
    { label: 'Holdings',         icon: Activity,       to: '/portfolio#holdings' },
    { label: 'Market Screener',  icon: BarChart2,      to: '/portfolio#market' },
    { label: 'Alert',            icon: Star,           to: '/portfolio#watchlist' },
    { label: 'Updates',          icon: Bell,           to: '/portfolio#updates' },
    { label: 'Help & Guide',     icon: HelpCircle,     to: '/portfolio#guide' },
    { section: 'Islamic Finance' },
    { label: 'Purification',     icon: HeartHandshake, to: '/portfolio#purification' },
    { label: 'Zakat',            icon: Calculator,     to: '/portfolio#zakat' },
    { label: 'Resources',        icon: BookOpen,       to: '/portfolio#lectures' },
    { section: 'Account' },
    { label: 'Statements',       icon: FileText,       to: '/portfolio#statement' },
    { label: 'Profile & Settings', icon: User,         to: '/profile' },
    ...(user?.role === 'admin' ? [
      { label: 'Admin Dashboard', icon: Shield, to: '/admin' },
    ] : []),
  ];

  const isCollapsed = collapsed && !mobileOpen;

  const isActive = (to) => {
    const toPath = to.split('#')[0];
    const toHash = to.split('#')[1] ? '#' + to.split('#')[1] : '';
    if (toPath === '/portfolio' || toPath === '/profile') {
      if (location.pathname !== toPath) return false;
      const currentHash = location.hash || (toPath === '/portfolio' ? '#holdings' : '');
      if (toHash) return currentHash === toHash;
      return currentHash === '';
    }
    return location.pathname === toPath || (toPath !== '/' && location.pathname.startsWith(toPath));
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside
      aria-label="Dashboard Navigation"
      className={`dashboard-sidebar-container ${mobileOpen ? 'open' : ''}`}
      style={{
        width: isCollapsed ? '72px' : '248px',
        minWidth: isCollapsed ? '72px' : '248px',
        background: 'var(--bg)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), min-width 0.35s cubic-bezier(0.16,1,0.3,1)',
        zIndex: 1001,
        overflow: 'hidden',
      }}
    >
      {/* ── Brand header ── */}
      <div style={{
        padding: isCollapsed ? '18px 0' : '18px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        minHeight: '68px',
      }}>
        {/* Logo mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.9rem', color: '#FFFFFF',
            flexShrink: 0,
          }}>إ</div>
          {!isCollapsed && (
            <span style={{
              fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)',
              letterSpacing: '-0.3px', whiteSpace: 'nowrap',
              fontFamily: 'var(--sans)',
            }}>
              Irshad
            </span>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        {!isCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="desktop-only-btn"
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--primary-50)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              flexShrink: 0, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <ChevronLeft size={14} />
          </button>
        )}

        {/* Expand (collapsed desktop) */}
        {isCollapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="desktop-only-btn"
            title="Expand"
            style={{
              position: 'absolute', bottom: '50%',
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'var(--bg)', border: '1px solid var(--border)',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', right: '-10px',
              boxShadow: 'var(--shadow-sm)', zIndex: 10,
            }}
          >
            <ChevronRight size={10} />
          </button>
        )}

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="mobile-only-btn"
          style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--primary-50)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav
        style={{ flex: 1, padding: isCollapsed ? '12px 8px' : '12px 10px', overflowY: 'auto' }}
        className="hide-scrollbar"
      >
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            if (isCollapsed) return (
              <div key={i} style={{ height: '1px', background: 'var(--border)', margin: '10px 4px' }} />
            );
            return (
              <div key={i} style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                padding: '16px 8px 6px', fontFamily: 'var(--sans)',
                userSelect: 'none',
              }}>
                {item.section}
              </div>
            );
          }

          const active = isActive(item.to);
          const Icon = item.icon;

          return (
            <Link
              key={i}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              onClick={(e) => {
                const [toPath, toHash] = item.to.split('#');
                if (toHash && location.pathname === toPath) {
                  e.preventDefault();
                  window.location.hash = toHash;
                }
                if (mobileOpen) setMobileOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: isCollapsed ? '10px' : '9px 10px',
                marginBottom: '2px',
                borderRadius: '10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: active ? 'var(--primary-50)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-body)',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.835rem',
                fontFamily: 'var(--sans)',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--primary-50)';
                  e.currentTarget.style.color = 'var(--text-dark)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-body)';
                }
              }}
            >
              <Icon
                size={16}
                style={{
                  flexShrink: 0,
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}
              />
              {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {/* Active dot */}
              {!isCollapsed && active && (
                <div style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: 'var(--primary)', flexShrink: 0,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: isCollapsed ? '12px 8px' : '12px',
        flexShrink: 0,
      }}>
        {!isCollapsed ? (
          <>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'var(--primary-50)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
                padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                width: '100%', justifyContent: 'center',
                transition: 'all 0.2s', marginBottom: '10px',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; e.currentTarget.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>

            {/* User row */}
            <Link
              to="/profile"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                textDecoration: 'none', padding: '8px', borderRadius: '10px',
                transition: 'background 0.15s', marginBottom: '4px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem',
                flexShrink: 0,
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                  {user?.email || ''}
                </div>
              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 10px', borderRadius: '10px',
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={14} /> Log Out
            </button>
          </>
        ) : (
          /* Collapsed footer */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleTheme}
              title={isDark ? 'Light Mode' : 'Dark Mode'}
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'var(--primary-50)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/profile" title="Profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem',
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Log Out"
              style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
