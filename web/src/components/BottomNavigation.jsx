import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Briefcase, Bell, User } from 'lucide-react';

export default function BottomNavigation() {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={20} /> },
    { label: 'Search', path: '/portfolio#market', icon: <Search size={20} /> },
    { label: 'Portfolio', path: '/portfolio#holdings', icon: <Briefcase size={20} /> },
    { label: 'Alerts', path: '/portfolio#watchlist', icon: <Bell size={20} /> },
    { label: 'Profile', path: '/profile', icon: <User size={20} /> },
  ];

  // Helper to determine if a nav item is active
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('/portfolio#')) {
      const hash = path.split('#')[1];
      return location.pathname === '/portfolio' && (location.hash === `#${hash}` || (!location.hash && hash === 'holdings'));
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bottom-nav-mobile">
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`bottom-nav-item ${active ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon">{item.icon}</div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
