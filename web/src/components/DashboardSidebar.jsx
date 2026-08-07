import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart2, Star, Activity,
  HeartHandshake, Calculator, BookOpen,
  User, LogOut, ChevronLeft, ChevronRight,
  X, Moon, Sun, Shield, FileText, Bell, HelpCircle
} from 'lucide-react';

export default function DashboardSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const NAV_ITEMS = [
    { section: 'Main' },
    { label: 'Holdings',       icon: Activity,         to: '/portfolio#holdings' },
    { label: 'Market Screener', icon: BarChart2,        to: '/portfolio#market' },
    { label: 'Alert',          icon: Star,             to: '/portfolio#watchlist' },
    { label: 'Updates',        icon: Bell,             to: '/portfolio#updates' },
    { label: 'Help & Guide',   icon: HelpCircle,       to: '/portfolio#guide' },
    { section: 'Islamic Finance' },
    { label: 'Purification',   icon: HeartHandshake,   to: '/portfolio#purification' },
    { label: 'Zakat',          icon: Calculator,        to: '/portfolio#zakat' },
    { label: 'Resources',      icon: BookOpen,          to: '/portfolio#lectures' },
    { section: 'Account' },
    { label: 'Statements',      icon: FileText,         to: '/portfolio#statement' },
    { label: 'Profile & Settings', icon: User,              to: '/profile' },
    ...(user?.role === 'admin' ? [
      { label: 'Admin Dashboard', icon: Shield, to: '/admin' },
      { label: 'Users', icon: User, to: '/admin/users' }
    ] : []),
  ];

  // On mobile, the drawer is ALWAYS fully expanded (text visible).
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside aria-label="Dashboard Navigation" className={`dashboard-sidebar-container ${mobileOpen ? 'open' : ''}`} style={{
      width: isCollapsed ? '80px' : '260px',
      background: 'var(--bg-alt)',
      borderRight: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* ── Brand ── */}
      <div style={{
        padding: isCollapsed ? '24px 0' : '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: '80px',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--gold-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.95rem', color: '#2A1A2E',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(201, 149, 42, 0.35)'
            }}>إ</div>
            <span style={{ 
              fontWeight: 800, 
              fontSize: '1.25rem', 
              color: '#C9952A', 
              letterSpacing: '-0.2px', 
              fontFamily: 'var(--serif), var(--sans)',
              textShadow: '0 2px 10px rgba(201, 149, 42, 0.2)'
            }}>
              Irshad
            </span>
          </div>
        )}
        {isCollapsed && (
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'var(--gold-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.95rem', color: '#2A1A2E',
            boxShadow: '0 4px 14px rgba(201, 149, 42, 0.35)'
          }}>إ</div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'var(--primary-50)', 
              border: 'none',
              display: 'none', 
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-body)',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            className="desktop-only-btn hover-bg-darker"
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--text-body)'; }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'var(--primary-50)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-dark)',
            flexShrink: 0,
          }}
          className="mobile-only-btn"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Expand button when collapsed ── */}
      {isCollapsed && (
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Expand sidebar"
            style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--primary-50)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-body)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-100)'; e.currentTarget.style.color = '#C9952A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--text-body)'; }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: isCollapsed ? '16px 0' : '20px 16px', overflowY: 'auto' }} className="hide-scrollbar">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            if (isCollapsed) return null;
            return (
              <div key={i} style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.4px',
                textTransform: 'uppercase', color: 'var(--text-body)',
                padding: '20px 12px 8px', fontFamily: 'var(--sans)'
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
              id={item.id}
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
                gap: '14px',
                padding: isCollapsed ? '12px 0' : '12px 16px',
                marginBottom: '6px',
                borderRadius: isCollapsed ? 0 : '12px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: active
                  ? 'rgba(201, 149, 42, 0.14)'
                  : 'transparent',
                color: active ? '#C9952A' : 'var(--text-body)',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.84rem',
                fontFamily: 'var(--sans)',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                borderLeft: active ? '3px solid #C9952A' : '3px solid transparent',
                boxShadow: active && !isCollapsed ? '0 4px 20px rgba(201, 149, 42, 0.15)' : 'none'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--primary-50)';
                  e.currentTarget.style.color = '#FFFFFF';
                  if (isCollapsed) e.currentTarget.style.borderLeft = '3px solid rgba(201, 149, 42, 0.5)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-body)';
                  if (isCollapsed) e.currentTarget.style.borderLeft = '3px solid transparent';
                }
              }}
            >
              <Icon size={isCollapsed ? 22 : 18} style={{ flexShrink: 0, opacity: active ? 1 : 0.8, color: active ? '#C9952A' : 'currentColor' }} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && active && (
                <div style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: '#C9952A',
                  boxShadow: '0 0 10px #C9952A'
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User Profile Footer ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: isCollapsed ? '20px 0' : '20px',
        flexShrink: 0,
        background: 'transparent',
      }}>
        {!isCollapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--primary-50)', 
                  border: '1px solid var(--border-strong)',
                  color: '#C9952A', fontSize: '0.72rem', fontWeight: 600,
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  width: '100%', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201, 149, 42, 0.15)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
            </div>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '14px', padding: '6px', borderRadius: '12px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2A1A2E', fontWeight: 800, fontSize: '1rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(201, 149, 42, 0.3)'
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--sans)' }}>
                  {user?.first_name || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {user?.email || 'user@iirshad.com'}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '10px', borderRadius: '10px',
                background: 'none', border: 'none',
                color: 'var(--text-body)', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-body)'; }}
            >
              <LogOut size={16} /> Log Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <button 
                onClick={toggleTheme}
                title={isDark ? "Light Mode" : "Dark Mode"}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--primary-50)', 
                  border: '1px solid var(--border-strong)',
                  color: '#C9952A', width: '42px', height: '42px',
                  borderRadius: '12px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/profile" title="Profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#2A1A2E', fontWeight: 800, fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(201, 149, 42, 0.3)'
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Log Out"
              aria-label="Log Out"
              style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-body)', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-body)'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
