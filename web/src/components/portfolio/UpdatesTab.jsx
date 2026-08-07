import React, { useState, useEffect } from 'react';
import { Newspaper, Inbox } from 'lucide-react';
import UpdatesNews  from './UpdatesNews';
import UpdatesInbox from './UpdatesInbox';
import { fetchUnreadCount } from '../../services/api';

/* ══════════════════════════════════════════════════════════════
   UpdatesTab — Container for News & Insights, Help & Guide, Inbox
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesTab() {
  const [activeSubTab, setActiveSubTab] = useState('news');
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread count every 60s for the badge
  useEffect(() => {
    const fetch = () => {
      fetchUnreadCount()
        .then(r => setUnreadCount(r?.data?.count || 0))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    {
      id: 'news',
      label: 'News & Insights',
      icon: Newspaper,
      description: 'Compliance changes, business activity & market intelligence',
    },
    {
      id: 'inbox',
      label: 'Inbox',
      icon: Inbox,
      description: 'Your notifications and alerts',
      badge: unreadCount,
    },
  ];

  return (
    <div>
      {/* Sub-tab Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '28px',
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
                  ? 'linear-gradient(135deg, rgba(118,88,122,0.08) 0%, rgba(212,160,23,0.05) 100%)'
                  : 'var(--bg-section)',
                border: isActive 
                  ? '1px solid rgba(212,160,23,0.3)' 
                  : '1px solid var(--border)',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 800 : 600,
                backdropFilter: isActive ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: isActive ? 'blur(10px)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                textAlign: 'left',
                boxShadow: isActive ? '0 8px 24px rgba(118,88,122,0.12)' : 'none',
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
              {/* Active indicator glowing bar */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'var(--primary)', borderRadius: '16px 16px 0 0',
                  boxShadow: '0 0 10px var(--primary)'
                }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: isActive ? 'var(--primary)' : 'var(--bg-section)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <Icon size={15} color={isActive ? 'white' : 'var(--text-muted)'} />
                </div>

                {/* Inbox badge */}
                {tab.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.63rem', fontWeight: 900,
                    padding: '2px 7px', borderRadius: '20px',
                    background: 'var(--primary)', color: 'white',
                    lineHeight: '16px',
                  }}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              <div>
                <div style={{
                  fontSize: '0.79rem', fontWeight: 900,
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

      {/* Tab Content with staggered fade up */}
      <div className="animate-slide-up stagger-3" key={activeSubTab} style={{ minHeight: '400px' }}>
        {activeSubTab === 'news'  && <UpdatesNews />}
        {activeSubTab === 'inbox' && <UpdatesInbox />}
      </div>
    </div>
  );
}
