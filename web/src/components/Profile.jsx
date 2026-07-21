import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Bell, Star, TrendingUp, TrendingDown, Eye, BarChart2,
  BookOpen, Award, CheckCircle, AlertTriangle, XCircle, 
  ArrowUpRight, ArrowDownRight, Activity, Trash2, Settings
} from 'lucide-react';
import { fetchProfile, fetchWatchlist, fetchPortfolio, fetchHistory, removeFromWatchlist } from '../services/api';

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
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    minWidth: '160px',
    transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden'
  }}
    onMouseEnter={e => { 
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'; 
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.borderColor = 'transparent';
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.boxShadow = 'none'; 
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.borderColor = 'var(--border)';
    }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${iconColor}15, transparent 70%)`, pointerEvents: 'none' }} />
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
      padding: '16px 20px',
      borderBottom: '1px solid var(--border)',
      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,82,87,0.06)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.zIndex = '10'; e.currentTarget.style.position = 'relative'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.zIndex = '1'; }}
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
  return (
    <div 
      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
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

/* ─── Main Profile Component ───────────────────────── */
export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [profileData, watchlistData, portfolioData, historyData] = await Promise.all([
          fetchProfile(),
          fetchWatchlist(),
          fetchPortfolio(),
          fetchHistory()
        ]);
        
        setProfileUser(profileData.data);
        setWatchlist(watchlistData);
        setPortfolio(portfolioData.data);
        setHistory(historyData.data.history || []);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  const removeFromWatchlistUI = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(w => w.filter(s => s.symbol !== symbol));
    } catch (err) {
      console.error("Failed to remove", err);
    }
  };

  if (authLoading || !user || isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="loading-spinner" />
    </div>
  );

  const currentUser = profileUser || user || {};
  const initials = (currentUser.name || currentUser.first_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const displayName = currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();

  // Halal metrics
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];
  const halalCount = safeWatchlist.filter(s => s.status === 'Halal').length;
  const nonHalalCount = safeWatchlist.filter(s => s.status === 'Non-Halal').length;
  const doubtfulCount = safeWatchlist.filter(s => s.status === 'Doubtful').length;
  const halalPercentage = safeWatchlist.length > 0 ? Math.round((halalCount / safeWatchlist.length) * 100) : 0;

  // Temporary mock data for activity if empty
  const safeHistory = Array.isArray(history) ? history : [];
  const displayHistory = safeHistory.length > 0 ? safeHistory : [
    { type: 'screening', label: 'GTCO screened as Halal', time: '2 hours ago' },
    { type: 'gain', label: 'DANGCEM up 2.14% today', time: '4 hours ago', value: '+₦5,600' },
    { type: 'view', label: 'You viewed ZENITHBANK', time: 'Yesterday' }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px' }} className="animate-fade-in">

      {/* ── Hero Banner ── */}
      <div className="animate-slide-up stagger-1" style={{
        background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)',
        borderRadius: '28px',
        padding: '36px 40px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(13,27,42,0.15)',
        gap: '20px'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '120px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', zIndex: 1 }}>
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

          <div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={14} color="var(--gold)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Screened</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{currentUser.screened_count || '0'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={14} color="var(--gold)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Watchlist</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{safeWatchlist.length} saved</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ zIndex: 1 }}>
          <button onClick={() => navigate('/settings')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', backdropFilter: 'blur(10px)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <Settings size={18} /> Edit Profile
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
        
        {/* Top Row: Quick Stats */}
        <div className="animate-slide-up stagger-2" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <StatCard label="Portfolio Value" value={fmt(portfolio?.summary?.total_balance || 0)} subValue={`${portfolio?.summary?.health_percentage || 0}% Halal`} icon={TrendingUp} iconColor="var(--halal)" />
          <StatCard label="Stocks Watched" value={safeWatchlist.length} subValue={`${halalCount} Halal, ${safeWatchlist.length - halalCount} Others`} icon={Star} iconColor="var(--primary)" />
          <StatCard label="Alerts" value="0" subValue="pending reviews" icon={Bell} iconColor="var(--doubtful)" />
        </div>

        {/* Middle Row: Halal Composition & Activity */}
        <div className="animate-slide-up stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          
          {/* Watchlist Composition */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={16} color="var(--primary)" /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Watchlist Composition</h3>
            </div>
            
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--halal)', lineHeight: 0.9, textShadow: '0 4px 16px rgba(4,120,87,0.2)' }}>{halalPercentage}%</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, paddingBottom: '4px' }}>Halal Compliant</span>
              </div>
              
              <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg)', display: 'flex', gap: '2px', marginBottom: '24px' }}>
                {safeWatchlist.map(s => (
                  <div key={s.symbol} style={{ flex: 1, background: s.status === 'Halal' ? 'var(--halal)' : s.status === 'Non-Halal' ? 'var(--non-halal)' : 'var(--doubtful)' }} />
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ background: 'var(--halal-bg)', borderRadius: '16px', padding: '16px', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', cursor: 'default', border: '1px solid transparent' }}
                     onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(4,120,87,0.15)'; e.currentTarget.style.borderColor = 'rgba(4,120,87,0.2)'; }} 
                     onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--halal)' }}>{halalCount}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--halal)' }}>Halal</div>
                </div>
                <div style={{ background: 'var(--doubtful-bg)', borderRadius: '16px', padding: '16px', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', cursor: 'default', border: '1px solid transparent' }}
                     onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.15)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; }} 
                     onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--doubtful)' }}>{doubtfulCount}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--doubtful)' }}>Doubtful</div>
                </div>
                <div style={{ background: 'var(--non-halal-bg)', borderRadius: '16px', padding: '16px', transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)', cursor: 'default', border: '1px solid transparent' }}
                     onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(220,38,38,0.15)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)'; }} 
                     onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--non-halal)' }}>{nonHalalCount}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--non-halal)' }}>Non-Halal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={16} color="var(--primary)" /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Recent Activity</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {displayHistory.map((item, i) => <ActivityRow key={i} item={item} />)}
            </div>
            <div style={{ padding: '12px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <button 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-50)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                View All Activity
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Row: Watchlist Details */}
        <div className="animate-slide-up stagger-4" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={16} color="var(--primary)" /></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>Your Watchlist</h3>
            </div>
            <Link to="/portfolio#market" className="hover-link" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>+ Discover Stocks</Link>
          </div>
          <div>
            {safeWatchlist.length > 0 ? (
              safeWatchlist.map(stock => <WatchlistRow key={stock.symbol} stock={stock} onRemove={removeFromWatchlistUI} />)
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--bg-section)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Star size={32} style={{ color: 'var(--text-light)' }} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-dark)' }}>Your watchlist is empty</div>
                <div style={{ fontSize: '0.9rem', marginTop: '8px', maxWidth: '300px', lineHeight: 1.5 }}>
                  Keep track of your favorite Halal stocks and get real-time price alerts.
                </div>
                <Link to="/portfolio#market" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(15,82,87,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <Search size={16} /> Explore Market
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
