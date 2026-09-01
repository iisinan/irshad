import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Activity, HeartHandshake, BookOpen,
  LogOut, ChevronLeft, X, Moon, Sun,
  LayoutDashboard, Shield, Users, ArrowLeft, Inbox, Mail
} from 'lucide-react';

export default function AdminSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const ADMIN_NAV_ITEMS = [
    { section: 'Admin' },
    { label: 'Overview',            icon: LayoutDashboard, to: '/admin' },
    { label: 'Alerts & Stocks',     icon: Activity,        to: '/admin/alerts' },
    { label: 'Inbox, Mail',               icon: Mail,            to: '/admin/inbox' },
    { label: 'Compliance Reviews',  icon: Shield,          to: '/admin/compliance-reviews' },
    { label: 'Registered Users',    icon: Users,           to: '/admin/users' },
    { label: 'Resources',           icon: BookOpen,        to: '/admin/resources' },
    { label: 'Financial Data Queue',icon: Inbox, Mail,           to: '/admin/financial-queue' },
    { label: 'Zakat Settings',      icon: HeartHandshake,  to: '/admin/zakat-settings' },
    { section: 'Exit' },
    { label: 'Back to App',         icon: ArrowLeft,       to: '/portfolio' },
  ];

  const isCollapsed = collapsed && !mobileOpen;

  const isActive = (to) => {
    const url = new URL(to, window.location.origin);
    const toPath = url.pathname;
    const toHash = url.hash;
    const toSearch = url.search;
    if (toPath === '/portfolio' || toPath === '/profile') {
      if (location.pathname !== toPath) return false;
      const currentHash = location.hash || (toPath === '/portfolio' ? '#holdings' : '');
      if (toHash) return currentHash === toHash;
      return currentHash === '';
    }
    if (location.pathname !== toPath) {
      if (toPath === '/admin') return false;
      return location.pathname.startsWith(toPath);
    }
    if (toSearch) return location.search.includes(toSearch.replace('?', ''));
    if (toPath === '/admin' && location.search.includes('tab=')) return false;
    return true;
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <aside
      aria-label="Admin Navigation"
      className={`dashboard-sidebar-container ${mobileOpen ? 'open' : ''}`}
      style={{
        width: isCollapsed ? '72px' : '248px',
        minWidth: isCollapsed ? '72px' : '248px',
        background: 'var(--bg)',
        boxShadow: '2px 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), min-width 0.35s cubic-bezier(0.16,1,0.3,1)',
        zIndex: 40,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.9rem', color: '#FFFFFF',
            flexShrink: 0,
          }}>إ</div>
          {!isCollapsed && (
            <div>
              <div style={{
                fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)',
                letterSpacing: '-0.3px', fontFamily: 'var(--sans)', lineHeight: 1.1,
              }}>Irshad</div>
              <div style={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1.2px',
                textTransform: 'uppercase', color: 'var(--primary)',
                fontFamily: 'var(--sans)',
              }}>Admin</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
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
        {ADMIN_NAV_ITEMS.map((item, i) => {
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
          const isExit = item.label === 'Back to App';

          return (
            <Link
              key={i}
              to={item.to}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: isCollapsed ? '10px' : '9px 10px',
                marginBottom: '2px',
                borderRadius: '10px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: active ? 'var(--primary-50)' : 'transparent',
                color: active ? 'var(--primary)' : isExit ? 'var(--text-muted)' : 'var(--text-body)',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.835rem',
                fontFamily: 'var(--sans)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = isExit ? 'rgba(239,68,68,0.06)' : 'var(--primary-50)';
                  e.currentTarget.style.color = isExit ? '#EF4444' : 'var(--text-dark)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isExit ? 'var(--text-muted)' : 'var(--text-body)';
                }
              }}
            >
              <Icon
                size={16}
                style={{
                  flexShrink: 0,
                  color: active ? 'var(--primary)' : isExit ? 'var(--text-muted)' : 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}
              />
                            {!isCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!isCollapsed && item.badge > 0 && (
                <span style={{
                  background: 'var(--non-compliant)', color: 'white',
                  fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px',
                  borderRadius: '10px', marginLeft: 'auto'
                }}>
                  {item.badge}
                </span>
              )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.first_name || user?.name || 'User'}
                  </span>
                  {user?.role === 'admin' && (
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 800,
                      color: '#FFFFFF', background: 'var(--primary)',
                      padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.5px',
                      textTransform: 'uppercase', flexShrink: 0,
                    }}>Admin</span>
                  )}
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
