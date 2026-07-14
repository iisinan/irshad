import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BarChart2, Briefcase, Star, Bell,
  HeartHandshake, Calculator, BookOpen, Newspaper,
  User, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, Globe, X, Search
} from 'lucide-react';

const NAV_ITEMS = [
  { section: 'Main' },
  { label: 'Screen a Stock', icon: Search,          to: '/market'         },
  { label: 'Watchlist',      icon: Star,             to: '/portfolio#watchlist' },
  { section: 'Islamic Finance' },
  { label: 'Purification',   icon: HeartHandshake,   to: '/portfolio#purification' },
  { label: 'Zakat',          icon: Calculator,        to: '/portfolio#zakat' },
  { label: 'Shariah',        icon: Shield,            to: '/portfolio#shariah'    },
  { section: 'Discover' },
  { label: 'About',          icon: Globe,             to: '/portfolio#about'       },
  { section: 'Account' },
  { label: 'Profile',        icon: User,              to: '/profile'     },
  { label: 'Settings',       icon: Settings,          to: '/profile#settings' },
];

export default function DashboardSidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (to) => {
    const path = to.split('#')[0];
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`dashboard-sidebar-container ${mobileOpen ? 'open' : ''}`} style={{
      width: collapsed ? '72px' : '240px',
      minHeight: '100vh',
      background: 'white',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1), transform 0.3s ease',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      zIndex: 1000,
    }}>

      {/* ── Brand ── */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: '70px',
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--gold-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.85rem', color: 'white',
              flexShrink: 0,
            }}>إ</div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)', letterSpacing: '-0.3px' }}>
              Irshad
            </span>
          </div>
        )}
        {collapsed && (
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--gold-grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.85rem', color: 'white',
          }}>إ</div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              display: 'none', // Hidden on mobile, shown on desktop via media query in reality, but we'll manage via a mobile check
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
              flexShrink: 0,
            }}
            className="desktop-only-btn"
          >
            <ChevronLeft size={14} />
          </button>
        )}
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--bg-section)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-dark)',
            flexShrink: 0,
          }}
          className="mobile-only-btn"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Expand button when collapsed ── */}
      {collapsed && (
        <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setCollapsed(false)}
            style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'var(--bg-section)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* ── Nav Items ── */}
      <nav style={{ flex: 1, padding: collapsed ? '12px 0' : '12px 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={i} style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: 'var(--text-light)',
                padding: '16px 8px 6px',
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
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: collapsed ? '10px 0' : '10px 10px',
                marginBottom: '2px',
                borderRadius: collapsed ? 0 : '12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active
                  ? 'var(--primary-50)'
                  : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: active ? 700 : 500,
                fontSize: '0.88rem',
                transition: 'all 0.18s ease',
                borderLeft: active && !collapsed ? '3px solid var(--primary)' : '3px solid transparent',
                paddingLeft: collapsed ? 0 : active ? '7px' : '10px',
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-section)';
                  e.currentTarget.style.color = 'var(--text-dark)';
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && (
                <div style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: 'var(--primary)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User Profile Footer ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: collapsed ? '16px 0' : '16px',
        flexShrink: 0,
      }}>
        {!collapsed ? (
          <div>
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '1rem',
                flexShrink: 0,
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name || user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || ''}
                </div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '8px 10px', borderRadius: '10px',
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--non-halal-bg)'; e.currentTarget.style.color = 'var(--non-halal)'; e.currentTarget.style.borderColor = 'var(--non-halal-border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <LogOut size={15} /> Log Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Link to="/profile" title="Profile" style={{ textDecoration: 'none' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--gold-grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '0.9rem',
              }}>
                {(user?.first_name || user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Log Out"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'none', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
