import React, { useState, useEffect } from 'react';
import { Newspaper, Bell, Moon, Clock, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UpdatesNews    from './UpdatesNews';
import UpdatesInbox   from './UpdatesInbox';

/* ── Greeting helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { emoji: '🌙', english: 'Good night' };
  if (h < 12) return { emoji: '☀️', english: 'Good morning' };
  if (h < 17) return { emoji: '🌤️', english: 'Good afternoon' };
  if (h < 21) return { emoji: '🌇', english: 'Good evening' };
  return        { emoji: '🌙', english: 'Good night' };
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

/* ══════════════════════════════════════════════════════════════
   UpdatesTab — Greeting banner + News & Inbox sub-tabs
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesTab({ unreadCount = 0 }) {
  const [activeSubTab, setActiveSubTab] = useState('news');
  const [now, setNow]                   = useState(new Date());
  const { user }    = useAuth();
  const greeting    = getGreeting();
  const firstName   = getFirstName(user);
  const hijriDate   = getHijriDate();

  // Live clock — tick every second
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
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

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
  ];

  return (
    <div>
      {/* ── Greeting Banner ── */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '24px',
        padding: '0',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>

        {/* Top strip with subtle pattern */}
        <div style={{
          height: '5px',
          background: 'var(--primary)',
          borderRadius: '24px 24px 0 0',
        }} />

        <div style={{ padding: '22px 24px 22px' }}>
          {/* Main row: greeting left, clock right */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>

            {/* Left: greeting */}
            <div>
              {/* Arabic */}
              <div style={{
                fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)',
                letterSpacing: '0.5px', marginBottom: '5px',
              }}>
                السلام عليكم ورحمة الله وبركاته
              </div>

              {/* Name line */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  fontSize: 'clamp(1.2rem, 3.5vw, 1.55rem)',
                  fontWeight: 900,
                  color: 'var(--text-dark)',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}>
                  {greeting.english}, {firstName}
                </span>
                <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{greeting.emoji}</span>
              </div>

              {/* Subtitle */}
              <p style={{
                fontSize: '0.78rem', color: 'var(--text-muted)',
                margin: '0 0 0', fontWeight: 600, lineHeight: 1.5,
              }}>
                Here's what's happening with your halal portfolio today.
              </p>

              {/* Unread pill */}
              {unreadCount > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  marginTop: '12px', background: 'var(--primary-50)',
                  border: '1px solid var(--primary-100)',
                  borderRadius: '30px', padding: '5px 12px',
                }}>
                  <Bell size={12} color="var(--primary)" />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Right: clock card */}
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
              {/* Time digits */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                fontFamily: 'var(--mono, monospace)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {/* HH */}
                <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1px' }}>{hh}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: '0 1px', opacity: 0.7 }}>:</span>
                {/* MM */}
                <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1, letterSpacing: '-1px' }}>{mm}</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1, margin: '0 1px', opacity: 0.7 }}>:</span>
                {/* SS */}
                <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-muted)', lineHeight: 1, letterSpacing: '-1px', opacity: 0.65 }}>{ss}</span>
              </div>

              {/* Gregorian date */}
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
                {dateStr}
              </div>

              {/* Hijri date */}
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
          </div>
        </div>
      </div>

      {/* ── Sub-tab Navigation ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`updates-tab-${tab.id}`}
              onClick={() => setActiveSubTab(tab.id)}
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
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--primary-100)';
              }}
              onMouseLeave={e => {
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
        {activeSubTab === 'news'  && <UpdatesNews />}
        {activeSubTab === 'inbox' && <UpdatesInbox />}
      </div>
    </div>
  );
}
