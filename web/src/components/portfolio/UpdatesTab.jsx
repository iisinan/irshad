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

      {/* ── Banner ── */}
      <div style={{
        display: 'flex',
        border: '1px solid color-mix(in srgb, var(--primary) 18%, var(--border))',
        borderRadius: '20px',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
        background: 'linear-gradient(110deg, var(--bg) 60%, color-mix(in srgb, var(--primary) 5%, var(--bg)) 100%)',
        animation: 'fadeIn 0.4s ease-out',
      }}>

        {/* Left accent bar — animated gradient */}
        <div style={{
          width: '5px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 45%, #8b5cf6) 60%, color-mix(in srgb, var(--primary) 25%, #06b6d4) 100%)',
        }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, padding: '13px 20px 13px 16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>

          {/* ── Row 1 ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

            {/* Left cluster */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 0 }}>

              {/* Salam pill */}
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                fontFamily: '"Amiri", "Scheherazade New", serif',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--primary)',
                background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
                borderRadius: '8px',
                padding: '3px 10px 3px 10px',
                direction: 'rtl',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
                marginRight: '12px',
                flexShrink: 0,
              }}>
                ٱلسَّلَامُ عَلَيْكُمْ
              </span>

              {/* Greeting + name */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: 'var(--text-dark)',
                  letterSpacing: '-0.4px',
                  lineHeight: 1.15,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {greeting.english}, {firstName}&nbsp;{greeting.emoji}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  marginTop: '1px',
                  letterSpacing: '0.01em',
                }}>
                  Your halal portfolio awaits
                </div>
              </div>

              {/* Unread badge */}
              {unreadCount > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: 'var(--primary)', color: '#fff',
                  borderRadius: '20px', padding: '2px 9px',
                  fontSize: '0.62rem', fontWeight: 800,
                  marginLeft: '12px', flexShrink: 0, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px color-mix(in srgb, var(--primary) 40%, transparent)',
                }}>
                  <Bell size={9} />
                  {unreadCount} new
                </span>
              )}
            </div>

            {/* Clock — right */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              flexShrink: 0, gap: '2px',
            }}>
              <div style={{
                fontFamily: '"SF Mono", "Fira Code", "Fira Mono", monospace',
                fontVariantNumeric: 'tabular-nums',
                display: 'flex', alignItems: 'baseline', gap: '0px', lineHeight: 1,
              }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-2px' }}>{hh}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.55, margin: '0 1px' }}>:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-2px' }}>{mm}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', opacity: 0.55, margin: '0 1px' }}>:</span>
                <span style={{
                  fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)',
                  opacity: 0.45, letterSpacing: '-0.5px',
                  alignSelf: 'flex-end', marginBottom: '2px',
                  transition: 'opacity 0.4s',
                }}>{ss}</span>
              </div>
              {hijriDate && (
                <span style={{
                  fontSize: '0.58rem', fontWeight: 700, color: 'var(--primary)',
                  opacity: 0.6, letterSpacing: '0.04em', textTransform: 'uppercase',
                  background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  padding: '1px 6px', borderRadius: '4px',
                }}>
                  {hijriDate}
                </span>
              )}
            </div>
          </div>

          {/* ── Row 2: Quote strip ── */}
          {quoteVisible && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingTop: '8px',
              borderTop: '1px solid color-mix(in srgb, var(--primary) 12%, var(--border))',
              minWidth: 0,
              animation: 'fadeIn 0.5s ease-out 0.1s both',
            }}>
              {/* Decorative quote mark */}
              <span style={{
                fontSize: '1.4rem',
                lineHeight: 1,
                color: 'var(--primary)',
                opacity: 0.25,
                fontFamily: 'Georgia, serif',
                flexShrink: 0,
                marginTop: '-4px',
                userSelect: 'none',
              }}>"</span>

              {/* Label badge */}
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#fff',
                background: 'var(--primary)',
                borderRadius: '4px',
                padding: '2px 6px',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}>
                {quote.label}
              </span>

              {/* Quote text */}
              <span style={{
                fontSize: '0.8rem',
                color: 'var(--text-dark)',
                fontWeight: 500,
                lineHeight: 1.55,
                opacity: 0.9,
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                fontStyle: 'italic',
              }}>
                {quote.text}
              </span>

              {/* Source */}
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: 'var(--primary)',
                opacity: 0.65,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                letterSpacing: '0.03em',
              }}>
                {quote.source}
              </span>

              {/* Dismiss */}
              <button
                onClick={() => setQuoteVisible(false)}
                aria-label="Dismiss quote"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '3px', display: 'flex',
                  alignItems: 'center', borderRadius: '50%', opacity: 0.3,
                  transition: 'opacity 0.15s, background 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.style.background = 'none'; }}
              >
                <X size={12} />
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
