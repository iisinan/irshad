import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart2, Briefcase, Star, Activity,
  HeartHandshake, Calculator, BookOpen,
  User, LogOut, ChevronLeft, ChevronRight,
  X, Moon, Sun
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Main' },
  { label: 'Portfolio',      icon: Activity,         to: '/portfolio#portfolio', id: 'tour-nav-portfolio' },
  { label: 'Market Screener', icon: BarChart2,        to: '/portfolio#market', id: 'tour-nav-market' },
  { label: 'Watchlist',      icon: Star,             to: '/portfolio#watchlist', id: 'tour-nav-watchlist' },
  { label: 'Thematic Baskets',icon: Briefcase,       to: '/portfolio#baskets', id: 'tour-nav-baskets' },
  { section: 'Islamic Finance' },
  { label: 'Purification',   icon: HeartHandshake,   to: '/portfolio#purification', id: 'tour-nav-purification' },
  { label: 'Zakat',          icon: Calculator,        to: '/portfolio#zakat', id: 'tour-nav-zakat' },
  { label: 'Resources',      icon: BookOpen,          to: '/portfolio#lectures', id: 'tour-nav-resources' },
  { section: 'Account' },
  { label: 'Profile & Settings', icon: User,              to: '/profile', id: 'tour-nav-profile' },
];

export default function DashboardSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // On mobile, the drawer is ALWAYS fully expanded (text visible).
  const isCollapsed = collapsed && !mobileOpen;

  const isActive = (to) => {
    const toPath = to.split('#')[0];
    const toHash = to.split('#')[1] ? '#' + to.split('#')[1] : '';

    if (toPath === '/portfolio' || toPath === '/profile') {
      if (location.pathname !== toPath) return false;
      const currentHash = location.hash || (toPath === '/portfolio' ? '#portfolio' : '');
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
      background: isDark ? 'rgba(6, 18, 20, 0.65)' : 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(15, 82, 87, 0.05)',
      boxShadow: '1px 0 30px rgba(0, 0, 0, 0.03)',
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
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
        minHeight: '80px',
        flexShrink: 0,
      }}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--gold-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.85rem', color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
            }}>إ</div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', letterSpacing: '-0.3px', fontFamily: 'var(--sans)' }}>
              Irshad
            </span>
          </div>
        )}
        {isCollapsed && (
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'var(--gold-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.85rem', color: '#fff',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
          }}>إ</div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
              border: 'none',
              display: 'none', 
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              flexShrink: 0,
              transition: 'all 0.2s ease'
            }}
            className="desktop-only-btn hover-bg-darker"
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: 'none',
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
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}` }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Expand sidebar"
            style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'}
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
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.2px',
                textTransform: 'uppercase', color: 'var(--text-light)',
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: isCollapsed ? '12px 0' : '12px 16px',
                marginBottom: '6px',
                borderRadius: isCollapsed ? 0 : '14px',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                background: active
                  ? (isDark ? 'rgba(45, 212, 191, 0.15)' : 'var(--primary)')
                  : 'transparent',
                color: active ? (isDark ? 'var(--primary)' : '#fff') : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.82rem',
                fontFamily: 'var(--sans)',
                transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                borderLeft: active && isCollapsed ? `3px solid var(--primary)` : '3px solid transparent',
                boxShadow: active && !isCollapsed && !isDark ? '0 8px 24px rgba(15, 82, 87, 0.25)' : 'none'
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
                  e.currentTarget.style.color = 'var(--text-dark)';
                  if(isCollapsed) e.currentTarget.style.borderLeft = '3px solid var(--text-muted)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  if(isCollapsed) e.currentTarget.style.borderLeft = '3px solid transparent';
                }
              }}
            >
              <Icon size={isCollapsed ? 22 : 18} style={{ flexShrink: 0, opacity: active ? 1 : 0.8 }} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && active && isDark && (
                <div style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: 'var(--primary)',
                  boxShadow: '0 0 10px var(--primary)'
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User Profile Footer ── */}
      <div style={{
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'}`,
        padding: isCollapsed ? '20px 0' : '20px',
        flexShrink: 0,
        background: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.01)',
      }}>
        {!isCollapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', 
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  color: 'var(--text-dark)', fontSize: '0.72rem', fontWeight: 600,
                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                  width: '100%', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                <span>{isDark ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
            </div>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', marginBottom: '14px', padding: '6px', borderRadius: '12px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)'
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--sans)' }}>
                  {user?.first_name || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {user?.email || 'user@irshad.com'}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '10px', borderRadius: '10px',
                background: 'none', border: 'none',
                color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--non-halal-bg)'; e.currentTarget.style.color = 'var(--non-halal)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
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
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', 
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
                  color: 'var(--text-dark)', width: '42px', height: '42px',
                  borderRadius: '12px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/profile" title="Profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)'
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
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--non-halal-bg)'; e.currentTarget.style.color = 'var(--non-halal)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
