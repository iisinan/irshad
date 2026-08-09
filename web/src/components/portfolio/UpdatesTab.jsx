import React, { useState } from 'react';
import { Newspaper, Bell, Sparkles, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import UpdatesNews    from './UpdatesNews';
import UpdatesInbox   from './UpdatesInbox';

/* ── Greeting helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12)  return { arabic: 'صباح الخير', english: 'Good morning' };
  if (h < 17)  return { arabic: 'مساء الخير', english: 'Good afternoon' };
  return          { arabic: 'مساء الخير', english: 'Good evening' };
}

function getFirstName(user) {
  if (!user) return 'there';
  return user.first_name || user.name?.split(' ')[0] || 'there';
}

/* ══════════════════════════════════════════════════════════════
   UpdatesTab — Greeting banner + News & Inbox sub-tabs
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesTab({ unreadCount = 0 }) {
  const [activeSubTab, setActiveSubTab] = useState('news');
  const { user } = useAuth();
  const greeting = getGreeting();
  const firstName = getFirstName(user);

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
        borderRadius: '20px',
        padding: '28px 28px 24px',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Subtle left accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)', borderRadius: '20px 0 0 20px' }} />
        <Moon size={90} style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', opacity: 0.04, pointerEvents: 'none' }} color="var(--primary)" />

        <div style={{ position: 'relative', zIndex: 1, paddingLeft: '8px' }}>
          {/* Arabic greeting */}
          <div style={{
            fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)',
            letterSpacing: '0.5px', marginBottom: '6px',
            fontFamily: 'var(--sans)',
          }}>
            السلام عليكم ورحمة الله وبركاته
          </div>

          {/* Main greeting */}
          <h1 style={{
            fontSize: 'clamp(1.3rem, 4vw, 1.75rem)',
            fontWeight: 900,
            color: 'var(--text-dark)',
            margin: '0 0 4px',
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            {greeting.english}, {firstName} 👋
          </h1>

          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            margin: 0,
            fontWeight: 600,
          }}>
            Here's what's happening with your halal portfolio today.
          </p>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              marginTop: '14px', background: 'var(--primary-50)',
              border: '1px solid var(--primary-100)',
              borderRadius: '30px', padding: '6px 14px',
            }}>
              <Bell size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)' }}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-tab Navigation ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        marginBottom: '24px',
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
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '16px 18px',
                borderRadius: '16px',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(91,41,113,0.08) 0%, rgba(209,165,98,0.05) 100%)'
                  : 'var(--bg-section)',
                border: isActive
                  ? '1px solid rgba(91,41,113,0.25)'
                  : '1px solid var(--border)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                backdropFilter: isActive ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: isActive ? 'blur(10px)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'left',
                boxShadow: isActive ? '0 8px 24px rgba(91,41,113,0.12)' : 'none',
                position: 'relative',
                overflow: 'hidden',
                transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--primary-100)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'var(--primary)', borderRadius: '16px 16px 0 0',
                  boxShadow: '0 0 10px var(--primary)',
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: isActive ? 'var(--primary)' : 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <Icon size={15} color={isActive ? 'white' : 'var(--text-muted)'} />
                </div>

                {/* Badge */}
                {tab.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.63rem', fontWeight: 900,
                    padding: '2px 7px', borderRadius: '20px',
                    background: 'var(--primary)', color: 'white',
                    lineHeight: '16px', animation: 'pulse 2s infinite',
                  }}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <div>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 900,
                  color: isActive ? 'var(--primary)' : 'var(--text-dark)',
                  marginBottom: '3px', lineHeight: 1.2,
                }}>
                  {tab.label}
                </div>
                <div style={{
                  fontSize: '0.66rem', color: 'var(--text-muted)',
                  fontWeight: 600, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {tab.description}
                </div>
              </div>
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
