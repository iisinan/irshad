import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User, Shield, CreditCard, Bell, ChevronRight, LogOut, Settings,
  HelpCircle, Star, TrendingUp, TrendingDown, Eye, BarChart2,
  BookOpen, Award, Clock, Plus, Trash2, CheckCircle, AlertTriangle,
  XCircle, ArrowUpRight, ArrowDownRight, Activity, Bookmark, RefreshCw
} from 'lucide-react';

/* ─── Helpers ──────────────────────────────────────── */
const fmt = (n) => Number(n).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const statusConfig = {
  Halal:     { color: 'var(--halal)',    bg: 'var(--halal-bg)',    icon: CheckCircle,    label: 'Halal' },
  'Non-Halal':{ color: 'var(--non-halal)',bg: 'var(--non-halal-bg)',icon: XCircle,       label: 'Non-Halal' },
  Doubtful:  { color: 'var(--doubtful)', bg: 'var(--doubtful-bg)', icon: AlertTriangle,  label: 'Doubtful' },
};

/* ─── Sub-components ────────────────────────────────── */

const StatCard = ({ label, value, subValue, icon: Icon, iconColor, trend }) => (
  <div style={{
    background: 'white',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minWidth: '160px',
    transition: 'var(--transition)',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} color={iconColor} />
      </div>
      {trend !== undefined && (
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: trend >= 0 ? 'var(--halal)' : 'var(--non-halal)', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</div>
      {subValue && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subValue}</div>}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
  </div>
);

const WatchlistRow = ({ stock, onRemove }) => {
  const isUp = stock.change >= 0;
  const s = statusConfig[stock.status] || statusConfig['Halal'];
  const SIcon = s.icon;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
      transition: 'var(--transition)',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={() => window.location.href = `/market/${stock.symbol}`}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', color: 'var(--primary)', flexShrink: 0 }}>
        {stock.symbol.slice(0, 3)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{stock.symbol}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stock.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <SIcon size={13} color={s.color} />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: s.color }}>{s.label}</span>
      </div>
      <div style={{ textAlign: 'right', minWidth: '90px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>₦{stock.price?.toLocaleString()}</div>
        <div style={{ fontSize: '0.78rem', color: isUp ? 'var(--halal)' : 'var(--non-halal)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
          {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {isUp ? '+' : ''}{stock.change?.toFixed(2)}%
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onRemove(stock.symbol); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--non-halal)'; e.currentTarget.style.background = 'var(--non-halal-bg)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.background = 'none'; }}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

const ActivityRow = ({ item }) => {
  const isUp = item.type === 'gain' || item.type === 'screening';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: item.type === 'alert' ? 'var(--doubtful-bg)' : 'var(--primary-50)',
        color: item.type === 'alert' ? 'var(--doubtful)' : 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {item.type === 'gain' && <TrendingUp size={16} />}
        {item.type === 'screening' && <CheckCircle size={16} />}
        {item.type === 'alert' && <AlertTriangle size={16} />}
        {item.type === 'view' && <Eye size={16} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>{item.label}</div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{item.time}</div>
      </div>
      {item.value && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: item.type === 'gain' ? 'var(--halal)' : 'var(--non-halal)' }}>{item.value}</div>}
    </div>
  );
};

const SectionHeader = ({ title, icon: Icon, action, actionLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0', padding: '20px 20px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="var(--primary)" />
      </div>
      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{title}</h3>
    </div>
    {action && (
      <button onClick={action} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {actionLabel}
      </button>
    )}
  </div>
);

const MenuItem = ({ icon: Icon, label, description, onClick, danger, badge }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
    background: 'none', border: 'none', padding: '14px 20px', cursor: 'pointer',
    textAlign: 'left', borderBottom: '1px solid var(--border)', transition: 'var(--transition)',
  }}
    onMouseEnter={e => e.currentTarget.style.background = danger ? 'var(--non-halal-bg)' : 'var(--bg-section)'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}
  >
    <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: danger ? 'var(--non-halal-bg)' : 'var(--primary-50)', color: danger ? 'var(--non-halal)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: danger ? 'var(--non-halal)' : 'var(--text-dark)' }}>{label}</div>
      {description && <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</div>}
    </div>
    {badge && <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.7rem', fontWeight: 800, borderRadius: '20px', padding: '2px 8px' }}>{badge}</span>}
    <ChevronRight size={16} color={danger ? 'var(--non-halal)' : 'var(--text-light)'} />
  </button>
);

/* ─── Sample data (replace with real API calls) ────── */
const SAMPLE_WATCHLIST = [
  { symbol: 'GTCO', name: 'Guaranty Trust Bank', price: 42.50, change: 1.23, status: 'Halal' },
  { symbol: 'ZENITHBANK', name: 'Zenith Bank Plc', price: 31.25, change: -0.56, status: 'Halal' },
  { symbol: 'DANGCEM', name: 'Dangote Cement', price: 280.00, change: 2.14, status: 'Halal' },
  { symbol: 'MTNN', name: 'MTN Nigeria', price: 198.30, change: -1.88, status: 'Doubtful' },
  { symbol: 'SEPLAT', name: 'Seplat Energy', price: 1640.00, change: 0.72, status: 'Non-Halal' },
];

const SAMPLE_ACTIVITY = [
  { type: 'screening', label: 'GTCO screened as Halal', time: '2 hours ago' },
  { type: 'gain', label: 'DANGCEM up 2.14% today', time: '4 hours ago', value: '+₦5,600' },
  { type: 'alert', label: 'MTNN status changed to Doubtful', time: 'Yesterday' },
  { type: 'view', label: 'You viewed ZENITHBANK', time: 'Yesterday' },
  { type: 'screening', label: 'SEPLAT screened — Non-Halal', time: '2 days ago' },
];

/* ─── Main Profile Component ───────────────────────── */
export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [watchlist, setWatchlist] = useState(SAMPLE_WATCHLIST);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  const initials = (user.name || user.first_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const displayName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'watchlist', label: 'Watchlist', icon: Star },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const removeFromWatchlist = (symbol) => setWatchlist(w => w.filter(s => s.symbol !== symbol));

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)',
        borderRadius: '28px',
        padding: '36px 40px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '28px',
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(13,27,42,0.15)',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '120px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        {/* Avatar */}
        <div style={{
          width: '88px', height: '88px', borderRadius: '22px',
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(10px)',
          border: '3px solid rgba(255,255,255,0.5)',
          color: 'white', fontSize: '2rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, letterSpacing: '-1px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          fontFamily: 'var(--serif)',
        }}>
          {initials}
        </div>

        {/* Name & email */}
        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
              {displayName}
            </h1>
            {user.premium && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                <Award size={13} /> PREMIUM
              </span>
            )}
          </div>
          <p style={{ margin: '6px 0 16px', color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user.email} <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /> Member since '23
          </p>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Stocks Screened', value: '48', icon: CheckCircle },
              { label: 'Watchlist', value: `${watchlist.length} saved`, icon: Star },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={14} color="var(--gold)" />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px', fontWeight: 700 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit profile button */}
        <button style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          color: 'white',
          borderRadius: '10px',
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '0.88rem',
          fontWeight: 700,
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: '8px',
          transition: 'var(--transition)',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
        >
          <User size={15} />
          Edit Profile
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '24px',
        background: 'white', padding: '6px', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', flexWrap: 'wrap',
      }}>
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, minWidth: '80px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--gold-grad)' : 'none',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.87rem',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: isActive ? '0 4px 12px rgba(201,168,76,0.35)' : 'none',
              }}
            >
              <TabIcon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <StatCard label="Portfolio Value" value="₦2.4M" subValue="+₦180k this month" icon={TrendingUp} iconColor="var(--halal)" trend={8.1} />
            <StatCard label="Stocks Watched" value={watchlist.length} subValue={`${watchlist.filter(s => s.status === 'Halal').length} Halal, ${watchlist.filter(s => s.status !== 'Halal').length} Others`} icon={Star} iconColor="var(--primary)" />
            <StatCard label="Screened Today" value="12" subValue="stocks analyzed" icon={CheckCircle} iconColor="var(--halal)" />
            <StatCard label="Alerts" value="3" subValue="pending reviews" icon={Bell} iconColor="var(--doubtful)" />
          </div>

          {/* Halal breakdown */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <SectionHeader title="Halal Screening Summary" icon={Shield} />
            <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {[
                { label: 'Halal', count: watchlist.filter(s => s.status === 'Halal').length, color: 'var(--halal)', bg: 'var(--halal-bg)', icon: CheckCircle },
                { label: 'Non-Halal', count: watchlist.filter(s => s.status === 'Non-Halal').length, color: 'var(--non-halal)', bg: 'var(--non-halal-bg)', icon: XCircle },
                { label: 'Doubtful', count: watchlist.filter(s => s.status === 'Doubtful').length, color: 'var(--doubtful)', bg: 'var(--doubtful-bg)', icon: AlertTriangle },
              ].map(({ label, count, color, bg, icon: SIcon }) => (
                <div key={label} style={{ flex: 1, minWidth: '120px', background: bg, border: `1px solid ${color}30`, borderRadius: 'var(--radius-lg)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <SIcon size={20} color={color} />
                  <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{label}</div>
                </div>
              ))}
              <div style={{ flex: 3, minWidth: '160px', padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Watchlist Composition</div>
                <div style={{ height: '10px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg)', display: 'flex', gap: '2px' }}>
                  {watchlist.map(s => (
                    <div key={s.symbol} style={{
                      flex: 1,
                      background: s.status === 'Halal' ? 'var(--halal)' : s.status === 'Non-Halal' ? 'var(--non-halal)' : 'var(--doubtful)',
                      borderRadius: '4px',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {Math.round((watchlist.filter(s => s.status === 'Halal').length / watchlist.length) * 100)}% of your watchlist is Halal compliant
                </div>
              </div>
            </div>
          </div>

          {/* Quick links to market */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { icon: BarChart2, label: 'Market Overview', desc: 'Browse NGX stocks', href: '/market', color: '#6366F1' },
              { icon: BookOpen, label: 'News & Insights', desc: 'Latest halal finance news', href: '/news', color: 'var(--primary)' },
              { icon: Shield, label: 'Shariah Guide', desc: 'Our screening methodology', href: '/shariah', color: 'var(--halal)' },
            ].map(item => (
              <Link key={item.label} to={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
                  padding: '20px', display: 'flex', gap: '14px', alignItems: 'center',
                  transition: 'var(--transition)',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = item.color; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <item.icon size={20} color={item.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── WATCHLIST TAB ── */}
      {activeTab === 'watchlist' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={16} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                  My Watchlist <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({watchlist.length})</span>
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate('/market')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--primary-50)', color: 'var(--primary)', border: '1px solid var(--primary-100)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <Plus size={14} />
                  Add Stock
                </button>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', padding: '14px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {['All', 'Halal', 'Doubtful', 'Non-Halal'].map(filter => (
                <button key={filter} style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  background: filter === 'All' ? 'var(--primary)' : 'none',
                  color: filter === 'All' ? 'white' : 'var(--text-muted)',
                  border: filter === 'All' ? '1px solid transparent' : '1px solid var(--border)',
                }}>
                  {filter}
                </button>
              ))}
            </div>

            {/* Table Header */}
            <div style={{ display: 'flex', padding: '10px 20px', background: 'var(--bg-section)' }}>
              <span style={{ flex: 1, fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stock</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '60px' }}>Status</span>
              <span style={{ fontSize: '0.72px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '90px', textAlign: 'right' }}>Price / Chg</span>
            </div>

            {watchlist.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Star size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>No stocks in your watchlist</div>
                <div style={{ fontSize: '0.85rem' }}>Visit the Market page to add stocks you want to follow</div>
              </div>
            ) : (
              watchlist.map(stock => <WatchlistRow key={stock.symbol} stock={stock} onRemove={removeFromWatchlist} />)
            )}
          </div>

          {/* Upgrade banner */}
          <div style={{ background: 'var(--gold-grad)', borderRadius: 'var(--radius-xl)', padding: '22px 28px', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Award size={36} color="white" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>Unlock Price Alerts</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', marginTop: '4px' }}>Get notified when your watchlist stocks hit your target price</div>
            </div>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
              Coming Soon
            </button>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Recent Activity</h3>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700 }}>
                View All
              </button>
            </div>
            {SAMPLE_ACTIVITY.map((item, i) => <ActivityRow key={i} item={item} />)}
          </div>

          {/* Screening history note */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bookmark size={22} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '4px' }}>Screening History</div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>You have screened <strong>48 stocks</strong> total since joining. Your activity helps improve the accuracy of our AI-based Shariah screening.</div>
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Account */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Account</div>
            </div>
            <MenuItem icon={User} label="Personal Information" description="Update your name, email and phone number" onClick={() => {}} />
            <MenuItem icon={Shield} label="Security & Password" description="Change password, enable 2FA" onClick={() => {}} badge="Action needed" />
            <MenuItem icon={CreditCard} label="Brokerage Connection" description="Link your broker for in-app trading" onClick={() => {}} />
          </div>

          {/* Preferences */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Preferences</div>
            </div>
            <MenuItem icon={Bell} label="Notifications" description="Manage price alerts and halal compliance alerts" onClick={() => {}} />
            <MenuItem icon={BookOpen} label="Shariah Preferences" description="Customize your screening strictness level" onClick={() => {}} />
          </div>

          {/* Support */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-section)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Support & Legal</div>
            </div>
            <MenuItem icon={HelpCircle} label="Help Center" description="Get help with your account and investments" onClick={() => {}} />
            <MenuItem icon={Shield} label="Shariah Methodology" description="Read about our screening process" onClick={() => navigate('/shariah')} />
            <MenuItem icon={Clock} label="Delete Account" description="Permanently remove your account and data" onClick={() => {}} danger />
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            style={{
              width: '100%', padding: '16px', background: 'white',
              border: '1px solid var(--non-halal-border)', borderRadius: 'var(--radius-xl)',
              cursor: 'pointer', color: 'var(--non-halal)', fontWeight: 800, fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--non-halal-bg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
