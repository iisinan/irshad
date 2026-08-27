import React, { useState, useEffect } from 'react';
import { Newspaper, Bell, Moon, Clock, Star, Mail, Droplet, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import IslamicQuote from '../IslamicQuote';
import UpdatesNews    from './UpdatesNews';
import UpdatesInbox   from './UpdatesInbox';
import UpdatesDigest  from './UpdatesDigest';
import UpdatesPurification from './UpdatesPurification';
import UpdatesCompliance  from './UpdatesCompliance';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--body-bg)', padding: '8px 16px', borderRadius: '14px', border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontFamily: 'var(--mono, monospace)', fontVariantNumeric: 'tabular-nums' }}>
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
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'var(--bg-section)',
      border: '1px solid var(--border)',
      borderRadius: '18px',
      padding: '16px 22px',
      minWidth: '140px',
      gap: '4px',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
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
  const { user }    = useAuth();
  const greeting    = getGreeting();
  const firstName   = getFirstName(user);
  const hijriDate   = getHijriDate();

  const tabs = [
    {
      id: 'news',
      label: 'News & Insights',
      icon: Newspaper,
      description: 'Compliance updates, business activity & market intelligence',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Bell,
      badge: unreadCount,
      description: 'Your personal notifications & alerts',
    },
    {
      id: 'digest',
      label: 'Irshad Digest',
      icon: Mail,
      description: 'Portfolio compliance status summary',
    },
    {
      id: 'compliance',
      label: 'Compliance Changes',
      icon: Shield,
      description: 'Recent status changes for screened companies',
    },
    {
      id: 'purification',
      label: 'Purification',
      icon: Droplet,
      description: 'Understanding stock purification and AAOIFI standards',
    },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', paddingBottom: '40px' }}>
      {/* ── Compact Greeting Banner ── */}
      <div style={{
        background: 'linear-gradient(145deg, var(--bg) 0%, rgba(91, 41, 113, 0.02) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '16px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(91, 41, 113, 0.04), inset 0 2px 0 rgba(255,255,255,0.7)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow orb */}
        <div style={{ position: 'absolute', top: '-50%', left: '-5%', width: '150px', height: '150px', background: 'radial-gradient(circle, var(--primary-50) 0%, transparent 70%)', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ 
            fontSize: '1.8rem', 
            lineHeight: 1, 
            background: 'var(--primary-50)', 
            width: '48px', 
            height: '48px', 
            borderRadius: '16px', 
            display: 'flex', 
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
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
        display: 'flex',
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
                if (tab.isExternal) {
                  window.location.hash = tab.id;
                } else {
                  setActiveSubTab(tab.id);
                }
              }}
              className={`animate-slide-up stagger-${index + 1}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '30px',
                background: isActive ? 'var(--primary)' : 'var(--bg-section)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                color: isActive ? 'white' : 'var(--text-dark)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: isActive ? '0 4px 14px rgba(91,41,113,0.3)' : 'none',
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
                  boxShadow: isActive ? 'none' : '0 2px 8px rgba(91,41,113,0.3)',
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
        {activeSubTab === 'digest'       && <UpdatesDigest />}
        {activeSubTab === 'purification' && <UpdatesPurification />}
      </div>
    </div>
  );
}
