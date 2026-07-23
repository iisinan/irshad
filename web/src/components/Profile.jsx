import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, Bell, Star, TrendingUp, TrendingDown, Eye, BarChart2,
  BookOpen, Award, CheckCircle, AlertTriangle, XCircle, 
  ArrowUpRight, ArrowDownRight, Activity, Trash2, Settings, Search, Sparkles, User, Monitor, LogOut, Save, AlertCircle, LayoutDashboard
} from 'lucide-react';
import { fetchProfile, fetchWatchlist, fetchPortfolio, fetchHistory, removeFromWatchlist, updateProfile, deleteAccount } from '../services/api';

/* ─── Helpers ──────────────────────────────────────── */
const fmt = (n) => Number(n).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

const statusConfig = {
  Halal:     { color: 'var(--halal)',    bg: 'var(--halal-bg)',    icon: CheckCircle,    label: 'Halal' },
  'Non-Halal':{ color: 'var(--non-halal)',bg: 'var(--non-halal-bg)',icon: XCircle,       label: 'Non-Halal' },
  Doubtful:  { color: 'var(--doubtful)', bg: 'var(--doubtful-bg)', icon: AlertTriangle,  label: 'Doubtful' },
};

/* ─── Sub-components ────────────────────────────────── */
const StatCard = ({ label, value, subValue, icon: Icon, iconColor, trend }) => (
  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minWidth: '160px', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', cursor: 'default', position: 'relative', overflow: 'hidden' }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'transparent'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle at top right, ${iconColor}15, transparent 70%)`, pointerEvents: 'none' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color={iconColor} /></div>
      {trend !== undefined && (
        <span style={{ fontSize: '0.69rem', fontWeight: 700, color: trend >= 0 ? 'var(--halal)' : 'var(--non-halal)', display: 'flex', alignItems: 'center', gap: '2px' }}>
          {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1 }}>{value}</div>
      {subValue && <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subValue}</div>}
    </div>
    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
  </div>
);

const WatchlistRow = ({ stock, onRemove }) => {
  const navigate = useNavigate();
  const isUp = stock.change >= 0;
  const s = statusConfig[stock.status] || statusConfig['Halal'];
  const SIcon = s.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: '1px solid var(--border)', transition: 'all 0.25s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,82,87,0.06)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.zIndex = '10'; e.currentTarget.style.position = 'relative'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.zIndex = '1'; }}
      onClick={() => navigate(`/market/${stock.symbol}`)}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.66rem', color: 'var(--primary)', flexShrink: 0 }}>{stock.symbol.slice(0, 3)}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-dark)' }}>{stock.symbol}</div>
        <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>{stock.name}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><SIcon size={13} color={s.color} /><span style={{ fontSize: '0.63rem', fontWeight: 700, color: s.color }}>{s.label}</span></div>
      <div style={{ textAlign: 'right', minWidth: '90px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-dark)' }}>₦{stock.price?.toLocaleString()}</div>
        <div style={{ fontSize: '0.69rem', color: isUp ? 'var(--halal)' : 'var(--non-halal)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
          {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{isUp ? '+' : ''}{stock.change?.toFixed(2)}%
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onRemove(stock.symbol); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--non-halal)'; e.currentTarget.style.background = 'var(--non-halal-bg)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-light)'; e.currentTarget.style.background = 'none'; }}
      ><Trash2 size={15} /></button>
    </div>
  );
};

const ActivityRow = ({ item }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'default' }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-section)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, background: item.type === 'alert' ? 'var(--doubtful-bg)' : 'var(--primary-50)', color: item.type === 'alert' ? 'var(--doubtful)' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {item.type === 'gain' && <TrendingUp size={16} />}{item.type === 'screening' && <CheckCircle size={16} />}{item.type === 'alert' && <AlertTriangle size={16} />}{item.type === 'view' && <Eye size={16} />}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.77rem', fontWeight: 600, color: 'var(--text-dark)' }}>{item.label}</div>
      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{item.time}</div>
    </div>
    {item.value && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: item.type === 'gain' ? 'var(--halal)' : 'var(--non-halal)' }}>{item.value}</div>}
  </div>
);

/* ─── Main Profile Component ───────────────────────── */
export default function Profile() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('profile');
  const [profileUser, setProfileUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Settings Forms State
  const [formData, setFormData] = useState({ name: '', email: '', phone_number: '', password: '', password_confirmation: '', strictness: 'moderate' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [theme, setTheme] = useState(() => localStorage.getItem('irshad_theme') || 'light');

  const handleReplayTour = () => {
    // If we had a context update function for user preferences
    navigate('/');
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        const [profileData, watchlistData, portfolioData, historyData] = await Promise.all([
          fetchProfile().catch(() => ({ data: null })),
          fetchWatchlist().catch(() => []),
          fetchPortfolio().catch(() => ({ data: null })),
          fetchHistory().catch(() => ({ data: { history: [] } }))
        ]);
        
        setProfileUser(profileData.data);
        setWatchlist(watchlistData);
        setPortfolio(portfolioData.data);
        setHistory(historyData.data?.history || []);
      } catch (err) {
        console.error("Failed to fetch profile data", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (!authLoading && user) loadData();
  }, [user, authLoading]);

  useEffect(() => {
    if (profileUser || user) {
      const u = profileUser || user || {};
      setFormData(prev => ({
        ...prev,
        name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        email: u.email || '',
        phone_number: u.phone_number || '',
        strictness: u.preferences?.strictness || 'moderate'
      }));
    }
  }, [profileUser, user]);

  const removeFromWatchlistUI = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      setWatchlist(w => w.filter(s => s.symbol !== symbol));
    } catch (err) { console.error("Failed to remove", err); }
  };

  const handleUpdate = async (e, section) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {};
      if (section === 'profile') {
        payload.name = formData.name;
        payload.email = formData.email;
        payload.phone_number = formData.phone_number;
      } else if (section === 'security') {
        if (formData.password !== formData.password_confirmation) {
          setMessage({ type: 'error', text: 'Passwords do not match' });
          setIsSubmitting(false); return;
        }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      } else if (section === 'preferences') {
        payload.preferences = { ...((profileUser || user).preferences || {}), strictness: formData.strictness };
      }
      const res = await updateProfile(payload);
      setProfileUser(res.data);
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      if (section === 'security') setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) return;
    setIsSubmitting(true);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' });
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="loading-spinner" /></div>;

  const currentUser = profileUser || user || {};
  const initials = (currentUser.name || currentUser.first_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const displayName = currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();

  // Metrics
  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];
  const halalCount = safeWatchlist.filter(s => s.status === 'Halal').length;
  const nonHalalCount = safeWatchlist.filter(s => s.status === 'Non-Halal').length;
  const doubtfulCount = safeWatchlist.filter(s => s.status === 'Doubtful').length;
  const halalPercentage = safeWatchlist.length > 0 ? Math.round((halalCount / safeWatchlist.length) * 100) : 0;
  const displayHistory = Array.isArray(history) && history.length > 0 ? history : [
    { type: 'screening', label: 'GTCO screened as Halal', time: '2 hours ago' },
    { type: 'gain', label: 'DANGCEM up 2.14% today', time: '4 hours ago', value: '+₦5,600' },
    { type: 'view', label: 'You viewed ZENITHBANK', time: 'Yesterday' }
  ];

  const sections = [
    { id: 'profile', icon: User, label: 'Personal Info' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'preferences', icon: BookOpen, label: 'Shariah Preferences' },
    { id: 'appearance', icon: Monitor, label: 'Appearance' },
    { id: 'danger', icon: Trash2, label: 'Danger Zone', danger: true },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px 80px' }} className="animate-fade-in">
      {/* ── Hero Banner ── */}
      <div className="animate-slide-up stagger-1" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0F5257 65%, #0B6B71 100%)', borderRadius: '28px', padding: '36px 40px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 32px rgba(13,27,42,0.15)', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(201,168,76,0.08)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', zIndex: 1 }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '22px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', border: '3px solid rgba(255,255,255,0.5)', color: 'var(--bg)', fontSize: '1.76rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '-1px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontFamily: 'var(--serif)' }}>{initials}</div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '1.76rem', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>{displayName}</h1>
              {user.premium && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', color: 'var(--gold)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.66rem', fontWeight: 800 }}><Award size={13} /> PREMIUM</span>}
            </div>
            <p style={{ margin: '6px 0 16px', color: 'rgba(255,255,255,0.65)', fontSize: '0.84rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>{user.email} <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} /> Member since '23</p>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={14} color="var(--gold)" /></div>
                <div><div style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>Screened</div><div style={{ color: 'white', fontWeight: 700, fontSize: '0.79rem' }}>{currentUser.screened_count || '0'}</div></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ zIndex: 1, display: 'flex', gap: '12px' }}>
          <button onClick={handleReplayTour} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'var(--bg)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)', backdropFilter: 'blur(10px)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}><Sparkles size={18} /> Replay Tour</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Left Sidebar Menu */}
        <div className="animate-slide-up stagger-2" style={{ width: '240px', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '100px' }}>
            {sections.map(sec => (
              <button key={sec.id} onClick={() => { setActiveSection(sec.id); setMessage({ type: '', text: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none', background: activeSection === sec.id ? (sec.danger ? 'var(--non-halal-bg)' : 'var(--bg)') : 'transparent', color: activeSection === sec.id ? (sec.danger ? 'var(--non-halal)' : 'var(--primary)') : 'var(--text-muted)', fontWeight: activeSection === sec.id ? 800 : 600, fontSize: '0.79rem', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', boxShadow: activeSection === sec.id && !sec.danger ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                <sec.icon size={18} />{sec.label}
              </button>
            ))}
            <div style={{ margin: '16px 0', height: '1px', background: 'var(--border)' }} />
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.79rem', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}>
              <LogOut size={18} />Sign Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="animate-slide-up stagger-3" style={{ flex: 1, minWidth: '300px' }}>
          
          {/* Settings Messages */}
          {message.text && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px', background: message.type === 'success' ? 'var(--halal-bg)' : 'var(--non-halal-bg)', color: message.type === 'success' ? 'var(--halal)' : 'var(--non-halal)', fontSize: '0.79rem', fontWeight: 600 }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}{message.text}
            </div>
          )}

          {/* OVERVIEW DASHBOARD */}


          {/* SETTINGS FORMS */}
          {true && (
            <div style={{ background: 'var(--bg)', borderRadius: '24px', border: '1px solid var(--border)', padding: '32px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
              
              {activeSection === 'profile' && (
                <form onSubmit={e => handleUpdate(e, 'profile')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><h2 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Personal Information</h2><p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Update your basic profile details.</p></div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.84rem', outline: 'none' }} /></div>
                    <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Phone Number</label><input type="tel" value={formData.phone_number} onChange={e => setFormData({...formData, phone_number: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.84rem', outline: 'none' }} /></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Email Address</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.84rem', outline: 'none', background: 'var(--bg)' }} readOnly /><p style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '6px' }}>Email cannot be changed.</p></div>
                  <div style={{ marginTop: '12px' }}><button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'var(--bg)', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}><Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Changes'}</button></div>
                </form>
              )}

              {activeSection === 'security' && (
                <form onSubmit={e => handleUpdate(e, 'security')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><h2 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Security</h2><p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Update your password to keep your account secure.</p></div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>New Password</label><input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.84rem', outline: 'none' }} minLength={8} required /></div>
                  <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '8px' }}>Confirm Password</label><input type="password" placeholder="••••••••" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '0.84rem', outline: 'none' }} minLength={8} required /></div>
                  <div style={{ marginTop: '12px' }}><button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'var(--bg)', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}><Save size={18} /> {isSubmitting ? 'Updating...' : 'Update Password'}</button></div>
                </form>
              )}

              {activeSection === 'preferences' && (
                <form onSubmit={e => handleUpdate(e, 'preferences')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><h2 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Shariah Screening Strictness</h2><p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Choose how strictly you want the AI to evaluate companies based on the AAOIFI standard.</p></div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {['relaxed', 'moderate', 'strict'].map(level => (
                      <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', border: `2px solid ${formData.strictness === level ? 'var(--primary)' : 'var(--border)'}`, background: formData.strictness === level ? 'var(--primary-50)' : 'var(--bg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <input type="radio" name="strictness" value={level} checked={formData.strictness === level} onChange={e => setFormData({...formData, strictness: e.target.value})} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                        <div>
                          <div style={{ fontWeight: 800, color: formData.strictness === level ? 'var(--primary)' : 'var(--text-dark)', fontSize: '0.88rem', textTransform: 'capitalize', marginBottom: '4px' }}>{level} Screening</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {level === 'relaxed' && "Focuses only on core business activities. Ignores minor financial ratios."}
                            {level === 'moderate' && "Standard AAOIFI compliance. Checks 30% debt limits and 5% impure income."}
                            {level === 'strict' && "Zero-tolerance policy. Any non-compliant debt or income flags the stock as non-halal."}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px' }}><button type="submit" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'var(--primary)', color: 'var(--bg)', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}><Save size={18} /> {isSubmitting ? 'Saving...' : 'Save Preferences'}</button></div>
                </form>
              )}

              {activeSection === 'appearance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><h2 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 4px' }}>Appearance Settings</h2><p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Customize the look and feel of Irshad.</p></div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-section)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <div><h3 style={{ margin: '0 0 4px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-dark)' }}>Theme</h3><p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Choose between Light and Dark mode.</p></div>
                    <select value={theme} onChange={(e) => {
                        const newTheme = e.target.value; setTheme(newTheme); localStorage.setItem('irshad_theme', newTheme);
                        if (newTheme === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); } else { document.documentElement.removeAttribute('data-theme'); }
                        setMessage({ type: 'success', text: 'Theme updated successfully!' }); setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                      }} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}>
                      <option value="light">Light Mode</option>
                      <option value="dark">Dark Mode</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSection === 'danger' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div><h2 style={{ fontSize: '1.06rem', fontWeight: 800, color: 'var(--non-halal)', margin: '0 0 4px' }}>Danger Zone</h2><p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>Irreversible and destructive actions.</p></div>
                  <div style={{ height: '1px', background: 'var(--border)' }} />
                  <div style={{ background: 'var(--non-halal-bg)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '16px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                    <div><h3 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--non-halal)' }}>Delete Account</h3><p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dark)' }}>Once you delete your account, there is no going back. Please be certain.</p></div>
                    <button onClick={handleDeleteAccount} disabled={isSubmitting} style={{ padding: '12px 24px', background: 'var(--non-halal)', color: 'var(--bg)', border: 'none', borderRadius: '10px', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Deleting...' : 'Delete Account'}</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
