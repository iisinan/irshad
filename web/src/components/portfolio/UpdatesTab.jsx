import React, { useState, useEffect } from 'react';
import { Newspaper, Lock, Bell, Moon, Clock, Star, Mail, Droplet, Shield, Rocket, Sparkles, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import IslamicQuote from '../IslamicQuote';
import UpdatesNews    from './UpdatesNews';
import UpdatesInbox   from './UpdatesInbox';
import UpdatesDigest  from './UpdatesDigest';
import UpdatesDividends from './UpdatesDividends';
import UpdatesCompliance  from './UpdatesCompliance';
import UpdatesIPO from './UpdatesIPO';
import PricingModal from '../PricingModal';

function MonthlySpotlightView() {
  const [spotlight, setSpotlight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/updates/monthly-spotlight')
      .then(res => {
        if (mounted) {
          setSpotlight(res.data?.data || null);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.response?.data?.message || 'Unable to load Monthly Spotlight insights.');
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
        Loading Monthly Spotlight insights...
      </div>
    );
  }

  if (error || !spotlight) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg)', borderRadius: '20px', border: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{error || 'No spotlight insights available yet.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--primary-50) 100%)', borderRadius: '20px', padding: '24px 28px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '100px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
          <Sparkles size={13} /> Noor (Max) Exclusive • {spotlight.month}
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-dark)' }}>Monthly Shariah Market Spotlight</h3>
        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Deep-dive monthly screening leaders, top-performing Halal equities, and sector compliance health across the NGX.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <TrendingUp size={18} color="var(--halal)" /> Top Halal Performers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(spotlight.top_halal_gainers || []).map(item => (
              <div key={item.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-section)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{item.symbol}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.sector}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)' }}>₦{Number(item.latest_price || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: Number(item.price_change_pct) >= 0 ? 'var(--halal)' : 'var(--non-compliant)' }}>
                    {Number(item.price_change_pct) >= 0 ? '+' : ''}{item.price_change_pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <Award size={18} color="var(--primary)" /> AAOIFI Ratio Health Leaders
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(spotlight.ratio_health_leaders || []).map(item => (
              <div key={item.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-section)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{item.symbol}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.sector}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  <div>Debt: <strong style={{ color: 'var(--halal)' }}>{item.debt_ratio}%</strong></div>
                  <div>Impure: <strong style={{ color: 'var(--halal)' }}>{item.impure_income_ratio}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <Star size={18} color="#d97706" /> Dividend Yield Leaders
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(spotlight.dividend_yield_leaders || []).length === 0 ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No upcoming Halal dividend leaders recorded this month.</div>
            ) : (
              (spotlight.dividend_yield_leaders || []).map((item, idx) => (
                <div key={`${item.symbol}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-section)' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{item.symbol}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--halal)' }}>₦{Number(item.dividend_amount || 0).toLocaleString()}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pay: {item.pay_date || 'TBA'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <Shield size={18} color="var(--primary)" /> Sector Shariah Compliance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(spotlight.sector_breakdown || []).map(sec => (
              <div key={sec.sector} style={{ padding: '10px 12px', borderRadius: '12px', background: 'var(--bg-section)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.84rem', color: 'var(--text-dark)' }}>{sec.sector}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.76rem', color: 'var(--halal)' }}>
                    {sec.halal_companies}/{sec.total_companies} Halal ({sec.compliance_rate}%)
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, Number(sec.compliance_rate || 0))}%`, height: '100%', background: 'var(--halal)', borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(spotlight.spotlight_articles || []).length > 0 && (
        <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>
            <Newspaper size={18} color="var(--primary)" /> Curated Market Intelligence Briefs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {(spotlight.spotlight_articles || []).map(art => (
              <div key={art.id} style={{ padding: '14px', borderRadius: '14px', background: 'var(--bg-section)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>{art.symbol || art.category}</span>
                  {art.time_ago && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{art.time_ago}</span>}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-dark)', lineHeight: 1.35 }}>{art.title}</div>
                {art.source_url && (
                  <a href={art.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', marginTop: 'auto', textDecoration: 'none' }}>
                    Read source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Greeting helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { emoji: '🌙', english: 'Good evening' };
  if (h < 12) return { emoji: '☀️', english: 'Good morning' };
  if (h < 17) return { emoji: '🌤️', english: 'Good afternoon' };
  if (h < 21) return { emoji: '🌇', english: 'Good evening' };
  return        { emoji: '🌙', english: 'Good evening' };
}

function getFirstName(user) {
  if (!user) return 'there';
  return user.first_name || user.name?.split(' ')[0] || 'there';
}

/* ── Hijri date helper (approx) ── */
function getHijriDate() {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  } catch {
    return null;
  }
}

/* ── Live Clock Component ── */
function LiveClock({ hijriDate, compact = false }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const [hh, mm, ss] = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ];
  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  if (compact) {
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--body-bg)', padding: '8px 16px', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'var(--mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>{hh}:{mm}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.7, marginLeft: '2px' }}>{ss}</span>
        </div>
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', opacity: 0.8 }} />
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{dateStr}</div>
        {hijriDate && (
          <>
            <div style={{ width: '1px', height: '16px', background: 'var(--border)', opacity: 0.8 }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{hijriDate}</div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-section)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '16px 22px',
      minWidth: '140px',
      gap: '4px',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: '2px',
        fontFamily: 'var(--mono, monospace)',
        fontVariantNumeric: 'tabular-nums',
      }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1px' }}>{hh}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: '0 1px', opacity: 0.7 }}>:</span>
        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1px' }}>{mm}</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: '0 1px', opacity: 0.7 }}>:</span>
        <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-muted)', lineHeight: 1, letterSpacing: '-1px', opacity: 0.65 }}>{ss}</span>
      </div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
        {dateStr}
      </div>
      {hijriDate && (
        <div style={{
          fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)',
          background: 'var(--primary-50)', borderRadius: '6px',
          padding: '2px 8px', marginTop: '4px', textAlign: 'center',
        }}>
          {hijriDate}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UpdatesTab — Greeting banner + News & Inbox sub-tabs
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesTab({ unreadCount = 0 }) {
  const [activeSubTab, setActiveSubTab] = useState('news');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { user }    = useAuth();
  const isTabLocked = (tabId) => {
    const userTier = user?.tier?.slug || 'free';
    const features = user?.tier?.features || {};
    if (userTier === 'max') return false;
    if (tabId === 'news' || tabId === 'inbox' || tabId === 'ipo') return false;
    if (tabId === 'dividends') return !(features.dividend_alerts ?? false);
    if (tabId === 'compliance') return !(features.drift_tracking ?? false);
    if (tabId === 'spotlight') return !(features.monthly_spotlight ?? false);
    return true;
  };
  const greeting    = getGreeting();
  const firstName   = getFirstName(user);
  const hijriDate   = getHijriDate();

  const tabs = [
    {
      id: 'news',
      hasNew: false,
      label: 'News & Insights',
      icon: Newspaper,
      description: 'Compliance updates, business activity & market intelligence',
    },
    {
      id: 'compliance',
      label: 'Compliance Changes',
      icon: Shield,
      description: '90-day drift tracking & status changes for screened companies',
    },
    {
      id: 'spotlight',
      label: 'Monthly Spotlight',
      icon: Sparkles,
      description: 'Full monthly Shariah market insights & ratio leaders',
    },
    {
      id: 'ipo',
      label: 'IPO',
      icon: Rocket,
      description: 'Upcoming Initial Public Offerings & Shariah analysis',
    },
    {
      id: 'dividends',
      label: 'Dividends',
      icon: Star,
      description: 'Recent dividend announcements and payouts',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Bell,
      hasNew: unreadCount > 0,
      description: 'Your personal notifications & alerts',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', paddingBottom: '40px' }}>
      {showUpgradeModal && <PricingModal onClose={() => setShowUpgradeModal(false)} />}

      {/* ── Compact Greeting Banner ── */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg) 0%, rgba(69, 165, 138, 0.02) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '16px 24px',
        marginBottom: '24px',
        position: 'relative', display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(69, 165, 138, 0.04), inset 0 2px 0 rgba(255,255,255,0.7)',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow orb */}
        <div style={{ position: 'absolute', top: '-50%', left: '-5%', width: '150px', height: '150px', background: 'radial-gradient(circle, var(--primary-50) 0%, transparent 70%)', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div style={{ 
            fontSize: '1.8rem', 
            lineHeight: 1, 
            background: 'var(--primary-50)', 
            width: '48px', 
            height: '48px', 
            borderRadius: '16px', 
            position: 'relative', display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            border: '1px solid var(--primary-100)'
          }}>
            {greeting.emoji}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '2px', fontFamily: '"Amiri", "Scheherazade New", serif', opacity: 0.9 }}>
              ٱلسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ ٱللَّٰهِ وَبَرَكَاتُهُ
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.4px', position: 'relative', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {greeting.english}, {firstName}
              {unreadCount > 0 && (
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', background: 'var(--primary)', padding: '2px 8px', borderRadius: '100px', boxShadow: '0 2px 8px var(--primary-50)' }}>
                  {unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <LiveClock hijriDate={hijriDate} compact={true} />
        </div>
      </div>

      <IslamicQuote compact={true} />

      {/* ── Sub-tab Navigation ── */}
      <div className="hide-scrollbar" style={{
        position: 'relative', display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px',
        overflowX: 'auto',
        maxWidth: '100%',
      }}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`updates-tab-${tab.id}`}
              onClick={() => {
                if (isTabLocked(tab.id)) {
                  setShowUpgradeModal(true);
                  return;
                }
                if (tab.isExternal) {
                  window.location.hash = tab.id;
                } else {
                  setActiveSubTab(tab.id);
                }
              }}
              className={`animate-slide-up stagger-${index + 1}`}
              style={{
                position: 'relative', display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '30px',
                background: isActive ? 'var(--primary)' : 'var(--bg-section)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: isActive ? 'white' : isTabLocked(tab.id) ? 'var(--text-muted)' : 'var(--text-dark)',
                opacity: 1,
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isActive ? '0 4px 14px rgba(69, 165, 138,0.3)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--primary-100)';
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = 'scale(0.96)';
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Icon size={16} />
              {tab.label}
              {isTabLocked(tab.id) && <Lock size={13} color={isActive ? '#fde68a' : '#d97706'} strokeWidth={2.3} style={{ marginLeft: 2, flexShrink: 0 }} />}
              
              {/* Badge */}
              {tab.badge > 0 && (
                <span style={{
                  background: isActive ? 'white' : 'var(--primary)',
                  color: isActive ? 'var(--primary)' : 'white',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  padding: '3px 8px',
                  borderRadius: '20px',
                  marginLeft: '4px',
                  lineHeight: 1,
                  boxShadow: isActive ? 'none' : '0 2px 8px rgba(69, 165, 138,0.3)',
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      <div className="animate-slide-up stagger-3" key={activeSubTab} style={{ minHeight: '400px' }}>
        {activeSubTab === 'news'         && <UpdatesNews />}
        {activeSubTab === 'inbox'        && <UpdatesInbox />}
        {activeSubTab === 'compliance'   && <UpdatesCompliance />}
        {activeSubTab === 'spotlight'    && <MonthlySpotlightView />}
        {activeSubTab === 'dividends' && <UpdatesDividends />}
        {activeSubTab === 'ipo'          && <UpdatesIPO />}
      </div>
    </div>
  );
}
