import React, { useState, useEffect, useMemo } from 'react';
import { Newspaper, Bell, Mail, Droplet, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UpdatesNews    from './UpdatesNews';
import UpdatesInbox   from './UpdatesInbox';
import UpdatesDigest  from './UpdatesDigest';
import UpdatesPurification from './UpdatesPurification';

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return { emoji: '🌙', english: 'Good night' };
  if (h < 12) return { emoji: '☀️', english: 'Good morning' };
  if (h < 17) return { emoji: '🌤️', english: 'Good afternoon' };
  if (h < 21) return { emoji: '🌇', english: 'Good evening' };
  return        { emoji: '🌙', english: 'Good evening' };
}
function getFirstName(user) {
  if (!user) return 'there';
  return user.first_name || user.name?.split(' ')[0] || 'there';
}
function getHijriDate() {
  try {
    return new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric', month: 'short', year: 'numeric',
    }).format(new Date());
  } catch { return null; }
}

/* ── Quotes ── */
const QUOTES = [
  { label: 'Dua',    text: 'O Allaah, I ask You for beneficial knowledge, good provision, and accepted deeds.',                                                                         source: 'Ibn Majah 5:925' },
  { label: 'Hadith', text: 'When the verses of Surat Al-Baqara about Riba were revealed, the Prophet ﷺ went to the mosque and then banned the trade of alcohol.',                       source: 'Bukhari 459' },
  { label: 'Dua',    text: 'O Allah, I ask You from Your bounty and generosity.',                                                                                                        source: 'Abu Dawud 2:465' },
  { label: 'Hadith', text: '"Tell me something about Islam which I can ask of no one but you." He ﷺ said: "Say: I believe in Allah — and then be steadfast."',                          source: 'Nawawi 21' },
  { label: 'Dua',    text: 'O Allaah, forgive me, have mercy on me, guide me, strengthen me, grant me well-being, provide for me, and elevate me.',                                    source: 'Ibn Majah 34:3845' },
];

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
      id: 'purification',
      label: 'Purification',
      icon: Droplet,
      description: 'Understanding stock purification and AAOIFI standards',
    },
  ];

  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', paddingBottom: '40px' }}>

      {/* ── Compact Banner ── */}
      <div style={{
        display: 'flex',
        border: '1px solid var(--border)',
        borderRadius: '18px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        background: 'var(--bg)',
      }}>

        {/* Left accent bar */}
        <div style={{
          width: '4px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 55%, #a78bfa) 100%)',
        }} />

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* ── Row 1: Greeting + Clock ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

            {/* Left: Salam · name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: '"Amiri", "Scheherazade New", serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--primary)',
                lineHeight: 1,
                direction: 'rtl',
                whiteSpace: 'nowrap',
              }}>
                ٱلسَّلَامُ عَلَيْكُمْ
              </span>
              <span style={{ width: '1px', height: '14px', background: 'var(--border)', flexShrink: 0 }} />
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: 'var(--text-dark)',
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}>
                {greeting.english}, {firstName} {greeting.emoji}
              </span>
              {unreadCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'var(--primary-50)', border: '1px solid var(--primary-100)',
                  borderRadius: '20px', padding: '2px 8px',
                  fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                }}>
                  <Bell size={10} />
                  {unreadCount} unread
                </span>
              )}
            </div>

            {/* Right: compact clock */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              flexShrink: 0, gap: '1px',
            }}>
              <div style={{
                fontFamily: 'var(--mono, monospace)',
                fontVariantNumeric: 'tabular-nums',
                display: 'flex', alignItems: 'baseline', gap: '1px',
              }}>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1.5px' }}>{hh}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.6 }}>:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-1.5px' }}>{mm}</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.6 }}>:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', opacity: 0.5, letterSpacing: '-0.5px', alignSelf: 'flex-end', marginBottom: '1px' }}>{ss}</span>
              </div>
              {hijriDate && (
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, color: 'var(--primary)',
                  opacity: 0.7, letterSpacing: '0.02em',
                }}>
                  {hijriDate}
                </span>
              )}
            </div>
          </div>

          {/* ── Row 2: Quote ── */}
          {quoteVisible && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              paddingTop: '8px',
              borderTop: '1px dashed color-mix(in srgb, var(--border) 80%, transparent)',
              minWidth: 0,
            }}>
              <Sparkles size={11} color="var(--primary)" style={{ flexShrink: 0, opacity: 0.7 }} />
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--primary)', opacity: 0.75,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {quote.label}
              </span>
              <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
              <span style={{
                fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 500,
                lineHeight: 1.5, opacity: 0.88,
                flex: 1, minWidth: 0,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {quote.text}
              </span>
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)',
                opacity: 0.6, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.02em',
              }}>
                {quote.source}
              </span>
              <button
                onClick={() => setQuoteVisible(false)}
                aria-label="Dismiss"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '2px', display: 'flex',
                  alignItems: 'center', borderRadius: '50%', opacity: 0.35,
                  transition: 'opacity 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

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
