import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Search, Filter, Check, CheckCheck, Trash2, Archive,
  RefreshCw, Inbox, TrendingUp, Shield, BarChart2, Zap, Lock,
  Settings, ChevronRight, X
} from 'lucide-react';
import {
  fetchInboxNotifications, markNotificationRead, markAllNotificationsRead,
  archiveNotification, deleteNotification
} from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Link } from 'react-router-dom';

/* ── Skeleton ── */
const NotifSkeleton = () => {
  const sh = {
    background: 'linear-gradient(90deg,var(--bg-section) 0%,rgba(255,255,255,0.7) 50%,var(--bg-section) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '8px',
  };
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <div style={{ ...sh, width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...sh, width: '50%', height: '12px', marginBottom: '8px' }} />
        <div style={{ ...sh, width: '85%', height: '14px', marginBottom: '6px' }} />
        <div style={{ ...sh, width: '40%', height: '10px' }} />
      </div>
    </div>
  );
};

/* ── Category config ── */
const CATEGORY_CONFIG = {
  portfolio:         { icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   label: 'Portfolio' },
  screening:         { icon: Shield,     color: 'var(--primary)',   bg: 'var(--primary-50)',   label: 'Screening' },
  market_news:       { icon: BarChart2,  color: '#0ea5e9',          bg: 'rgba(14,165,233,0.1)', label: 'Market News' },
  business_activity: { icon: Zap,        color: 'var(--doubtful)',  bg: 'var(--doubtful-bg)',  label: 'Business Activity' },
  price_alerts:      { icon: Bell,       color: 'var(--gold)',      bg: 'var(--gold-50)',      label: 'Price Alerts' },
  system:            { icon: Settings,   color: 'var(--text-muted)', bg: 'var(--bg-section)', label: 'System' },
  security:          { icon: Lock,       color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', label: 'Security' },
};

const ALL_CATEGORIES = ['all', ...Object.keys(CATEGORY_CONFIG)];

const getCategoryConfig = (category) => CATEGORY_CONFIG[category] || CATEGORY_CONFIG['system'];

/* ── Single Notification Card ── */
const NotifCard = ({ notif, onRead, onArchive, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cfg = getCategoryConfig(notif.category);
  const Icon = cfg.icon;
  const isUnread = !notif.read_at;

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <div className="animate-slide-up" style={{
      background: isUnread ? `color-mix(in srgb, ${cfg.color} 3%, var(--bg))` : 'var(--bg)',
      border: `1px solid ${isUnread ? `color-mix(in srgb, ${cfg.color} 20%, var(--border))` : 'var(--border)'}`,
      borderRadius: '14px',
      padding: '16px',
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = isUnread ? `color-mix(in srgb, ${cfg.color} 40%, var(--border))` : 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isUnread ? `color-mix(in srgb, ${cfg.color} 20%, var(--border))` : 'var(--border)'; }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, animation: 'pulse 2s infinite' }} />
      )}

      {/* Icon */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px',
        background: cfg.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        fontSize: '1.1rem', lineHeight: 1,
      }}>
        {notif.icon && notif.icon.length <= 2 && !/[a-zA-Z]/.test(notif.icon)
          ? <span>{notif.icon}</span>
          : <Icon size={16} color={cfg.color} />
        }
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: isUnread ? 900 : 800, color: 'var(--text-dark)' }}>{notif.title}</span>
            <span style={{ marginLeft: '8px', fontSize: '0.63rem', fontWeight: 800, padding: '2px 7px', borderRadius: '8px', background: cfg.bg, color: cfg.color }}>
              {getCategoryConfig(notif.category).label}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 10px', paddingRight: '20px' }}>{notif.message}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {new Date(notif.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
            {notif.action_url && notif.action_url.startsWith('/') ? (
              <Link to={notif.action_url.replace(/^\/stock\//, '/market/')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
                {notif.action_label || 'View'} <ChevronRight size={11} />
              </Link>
            ) : notif.action_url ? (
              <a href={notif.action_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
                {notif.action_label || 'View'} <ChevronRight size={11} />
              </a>
            ) : null}
            {isUnread && (
              <button onClick={() => onRead(notif.id)} title="Mark as read" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px 8px', cursor: 'pointer' }}>
                <Check size={11} /> Read
              </button>
            )}
            <button onClick={() => onArchive(notif.id)} title="Archive" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px 8px', cursor: 'pointer' }}>
              <Archive size={11} />
            </button>
            <button onClick={() => onDelete(notif.id)} title="Delete" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--non-halal)', background: 'var(--non-halal-bg)', border: '1px solid var(--non-halal-border)', borderRadius: '8px', padding: '3px 8px', cursor: 'pointer' }}>
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Removed Mock Notifications ── */

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesInbox() {
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [loading, setLoading]               = useState(true);
  const [loadingMore, setLoadingMore]       = useState(false);
  const [pagination, setPagination]         = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch]                 = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async (params = {}, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const res = await fetchInboxNotifications({
        category: activeCategory !== 'all' ? activeCategory : undefined,
        search:   search || undefined,
        unread:   showUnreadOnly || undefined,
        page:     params.page || 1,
      });

      const newItems = res.data || [];
      setNotifications(prev => append ? [...prev, ...newItems] : newItems);
      setUnreadCount(res.unread_count || 0);
      setPagination(res.pagination);
    } catch {
      if (!append) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeCategory, search, showUnreadOnly]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    pollRef.current = setInterval(() => load({}, false), 60_000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { toastError('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
      toastSuccess('All notifications marked as read');
    } catch { toastError('Failed to mark all as read'); }
  };

  const handleArchive = async (id) => {
    try {
      await archiveNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toastSuccess('Notification archived');
    } catch { toastError('Failed to archive notification'); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toastSuccess('Notification deleted');
    } catch { toastError('Failed to delete notification'); }
  };

  const handleLoadMore = () => {
    if (pagination && pagination.current_page < pagination.last_page) {
      load({ page: pagination.current_page + 1 }, true);
    }
  };

  const displayedNotifications = notifications;

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Inbox</h2>
          {unreadCount > 0 && (
            <span style={{ fontSize: '0.69rem', fontWeight: 900, padding: '3px 9px', borderRadius: '20px', background: 'var(--primary)', color: 'white' }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
              <CheckCheck size={13} /> Mark All Read
            </button>
          )}
          <button onClick={() => load()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search notifications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '9px 12px 9px 34px',
              border: '1px solid var(--border)', borderRadius: '12px',
              background: 'var(--bg)', color: 'var(--text-dark)',
              fontSize: '0.75rem', fontWeight: 600, outline: 'none',
              fontFamily: 'var(--sans)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <X size={13} color="var(--text-muted)" />
            </button>
          )}
        </div>
        {/* Unread toggle */}
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '12px',
            border: `1px solid ${showUnreadOnly ? 'var(--primary)' : 'var(--border)'}`,
            background: showUnreadOnly ? 'var(--primary-50)' : 'var(--bg)',
            color: showUnreadOnly ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Filter size={12} /> Unread
        </button>
      </div>

      {/* Category Filter */}
      <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', padding: '2px' }}>
        {ALL_CATEGORIES.map(cat => {
          const cfg = cat === 'all' ? { color: 'var(--primary)', bg: 'var(--primary-50)', label: 'All' } : { ...getCategoryConfig(cat), label: getCategoryConfig(cat).label };
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 13px', borderRadius: '10px',
                border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
                background: isActive ? `color-mix(in srgb, ${cfg.color} 10%, transparent)` : 'var(--bg)',
                color: isActive ? cfg.color : 'var(--text-muted)',
                fontWeight: 800, fontSize: '0.69rem', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {cat !== 'all' && React.createElement(CATEGORY_CONFIG[cat].icon, { size: 11 })}
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4].map(i => <NotifSkeleton key={i} />)}
        </div>
      ) : displayedNotifications.length === 0 ? (
        <div className="animate-slide-up" style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-section)', borderRadius: '16px', border: '1.5px dashed var(--border)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'float 6s ease-in-out infinite' }}>
            <Inbox size={26} color="var(--primary)" style={{ opacity: 0.7 }} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>
            {search || showUnreadOnly || activeCategory !== 'all' ? 'No Matching Notifications' : 'Your Inbox is Empty'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {search || showUnreadOnly || activeCategory !== 'all'
              ? 'Try adjusting your filters or search query.'
              : 'Irshad will notify you about compliance changes, portfolio updates, and market alerts here.'
            }
          </div>
          {(search || showUnreadOnly || activeCategory !== 'all') && (
            <button
              onClick={() => { setSearch(''); setShowUnreadOnly(false); setActiveCategory('all'); }}
              style={{ marginTop: '16px', padding: '8px 18px', borderRadius: '10px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="animate-slide-up stagger-1" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayedNotifications.map(notif => (
              <NotifCard
                key={notif.id}
                notif={notif}
                onRead={handleRead}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination && pagination.current_page < pagination.last_page && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {loadingMore ? <><RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</> : `Load More (${pagination.total - displayedNotifications.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
