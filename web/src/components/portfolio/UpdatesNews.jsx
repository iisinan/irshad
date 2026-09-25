import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, Droplet, CheckCircle2, BarChart2,
  ExternalLink, RefreshCw, Mail, Bell, ChevronRight,
  ArrowRight, Newspaper, Zap, Shield, Star, X
} from 'lucide-react';
import api, { fetchUpdatesNews } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import CompanyLogo from '../CompanyLogo';
import localforage from 'localforage';
import UpdatesPurification from './UpdatesPurification';

/* ── Skeleton ── */
export const CardSkeleton = () => {
  const sh = {
    background: 'linear-gradient(90deg,var(--bg-section) 0%,rgba(255,255,255,0.7) 50%,var(--bg-section) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    borderRadius: '8px',
  };
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', display: 'flex', gap: '14px' }}>
      <div style={{ ...sh, width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...sh, width: '40%', height: '12px', marginBottom: '10px' }} />
        <div style={{ ...sh, width: '80%', height: '16px', marginBottom: '8px' }} />
        <div style={{ ...sh, width: '60%', height: '16px' }} />
      </div>
    </div>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const cfg = {
    halal:     { bg: 'var(--halal-bg)',     border: 'var(--halal-border)',     color: 'var(--halal)',     label: 'Shariah Compliant' },
    non_compliant: { bg: 'var(--non-compliant-bg)', border: 'var(--non-compliant-border)', color: 'var(--non-compliant)', label: 'Shariah Non-Compliant' },
    doubtful:  { bg: 'var(--doubtful-bg)',  border: 'var(--doubtful-border)',  color: 'var(--doubtful)',  label: 'Doubtful' },
    watchlist: { bg: 'var(--review-bg)',    border: 'var(--review-border)',    color: 'var(--review)',    label: 'Watchlist' },
  };
  const s = cfg[status] || cfg['doubtful'];
  return (
    <span style={{ fontSize: '0.69rem', fontWeight: 800, padding: '3px 9px', borderRadius: '20px', background: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

/* ── Confidence pill removed per user request ── */

/* ── Section header ── */
const SectionHeader = ({ icon: Icon, title, count, color = 'var(--primary)' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={16} color={color} />
    </div>
    <div>
      <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>{title}</h2>
    </div>
    {count !== undefined && (
      <span style={{ marginLeft: 'auto', fontSize: '0.69rem', fontWeight: 800, color, background: `color-mix(in srgb, ${color} 10%, transparent)`, padding: '3px 9px', borderRadius: '20px' }}>
        {count}
      </span>
    )}
  </div>
);


/* ── Business Update Card ── */
const BusinessCard = ({ item, onSelectUrl }) => {
  const typeColors = {
    acquisition:         { color: 'var(--primary)',   bg: 'var(--primary-50)' },
    new_business:        { color: 'var(--review)',     bg: 'var(--review-bg)' },
    disposal:            { color: 'var(--doubtful)',   bg: 'var(--doubtful-bg)' },
    prohibited_activity: { color: 'var(--non-compliant)', bg: 'var(--non-compliant-bg)' },
    islamic_finance:     { color: 'var(--halal)',      bg: 'var(--halal-bg)' },
    regulatory:          { color: '#7C3AED',           bg: 'rgba(124,58,237,0.1)' },
  };
  const tc = typeColors[item.activity_type] || { color: 'var(--text-muted)', bg: 'var(--bg-section)' };
  const navigate = useNavigate();

  return (
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: item.source_url ? 'pointer' : 'default' }}
      onClick={() => onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ flexShrink: 0 }}>
        <div onClick={(e) => { e.stopPropagation(); if (item.symbol) navigate(`/market/${item.symbol}/aaoifi`); }}><CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={40} /></div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{item.name || item.symbol}</div>
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.symbol}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.66rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', background: tc.bg, color: tc.color }}>
              {item.activity_label || item.activity_type}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.5, margin: '0 0 10px' }}>{item.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {item.source && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Source: {item.source}</span>}
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.time_ago}</span>
          </div>
          {item.source_url && (
            <div onClick={(e) => { e.stopPropagation(); onSelectUrl ? onSelectUrl(item.source_url) : window.open(item.source_url, '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
              Read Source <ExternalLink size={11} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Market Intelligence Card ── */
export const MarketCard = ({ item, onSelectUrl }) => {
  const navigate = useNavigate();
  const categoryIcons = {
    market_intelligence: BarChart2,
    earnings:            TrendingUp,
    dividend:            Star,
    aaoifi:              Shield,
    screening:           CheckCircle2,
  };
  const Icon = categoryIcons[item.category] || Newspaper;
  const categoryColor = {
    market_intelligence: 'var(--primary)',
    earnings:            '#8b5cf6',
    dividend:            'var(--gold)',
    aaoifi:              'var(--halal)',
    screening:           'var(--review)',
  }[item.category] || 'var(--text-muted)';

  return (
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: item.source_url ? 'pointer' : 'default' }}
      onClick={() => onSelectUrl && item.source_url ? onSelectUrl(item.source_url) : null}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `color-mix(in srgb, ${categoryColor} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <Icon size={15} color={categoryColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '12px', flexDirection: 'row' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px', lineHeight: 1.3 }}>{item.title}</div>
          {item.content && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 8px' }}>{item.content.substring(0, 140)}{item.content.length > 140 ? '...' : ''}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {item.source && <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.source}</span>}
            <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.time_ago}</span>
            {item.source_url && (
              <div onClick={(e) => { e.stopPropagation(); onSelectUrl ? onSelectUrl(item.source_url) : window.open(item.source_url, '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none', marginLeft: 'auto' }}>
                Read More <ExternalLink size={10} />
              </div>
            )}
          </div>
        </div>
        {item.image_url && (
          <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Empty State ── */
export const EmptyState = ({ icon: Icon, title, subtitle, color = 'var(--primary)' }) => (
  <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-section)', borderRadius: '16px', border: '1.5px dashed var(--border)' }}>
    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: `color-mix(in srgb, ${color} 10%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
      <Icon size={24} color={color} style={{ opacity: 0.7 }} />
    </div>
    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>{title}</div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{subtitle}</div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export default function UpdatesNews() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('market');
  const [selectedUrl, setSelectedUrl] = useState(null);

  const handleSelectUrl = async (url) => {
    try {
      const res = await api.get(`/utils/check-iframe?url=${encodeURIComponent(url)}`);
      if (res.data.can_iframe) {
        setSelectedUrl(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
      localforage.setItem('irshad_updates_news_cache', res.data);
    } catch (err) {
      if (!data && !silent) setError(err?.response?.data?.message || 'Failed to load news & insights.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    localforage.getItem('irshad_updates_news_cache').then(cached => {
      if (cached && !data) {
        setData(cached);
        setLoading(false);
      }
    }).catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = [
    { id: 'market',       label: 'Market Intelligence', icon: BarChart2,    color: 'var(--primary)' },
    { id: 'analysis',     label: 'Analysis',            icon: TrendingUp,   color: '#8b5cf6' },
    { id: 'purification', label: 'Why Purification',    icon: Droplet,      color: '#0ea5e9' },
  ];

  const complianceChanges  = data?.compliance_changes  || [];
  const rawBusiness        = data?.business_updates    || [];
  const rawMarket          = data?.market_intelligence || [];
  
  // Merge Business Activity and Market Intelligence
  const businessItems = rawBusiness.map(e => ({ ...e, _cardType: 'business' }));
  const marketItems = rawMarket.map(e => ({ ...e, _cardType: 'market' }));
  const marketIntelligence = [...businessItems, ...marketItems].sort((a, b) => {
    return new Date(b.published_at || 0) - new Date(a.published_at || 0);
  });

  const dividendsData      = data?.dividends           || [];
  const analysisData       = data?.analysis            || [];

  return (
    <div>
      {selectedUrl && (
        <div className="animate-slide-up" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--bg)', zIndex: 99999, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => setSelectedUrl(null)} 
              className="hover-lift"
              style={{ background: 'var(--bg-section)', border: '1px solid var(--border)', borderRadius: '100px', cursor: 'pointer', color: 'var(--text-dark)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back to Market Intelligence
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reader View</div>
          </div>
          <div style={{ flex: 1, WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
            <iframe 
              src={selectedUrl} 
              style={{ display: 'block', border: 'none', width: '100%', height: '100%', background: '#fff' }} 
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms" 
              title="News Article Reader"
            />
          </div>
        </div>
      )}
      {/* Horizontal Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '8px' }} className="hide-scrollbar">
        {sections.map(s => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px',
                borderRadius: '16px',
                border: `1px solid ${isActive ? s.color : 'var(--border)'}`,
                background: isActive ? `${s.color}15` : 'var(--bg-alt)',
                color: isActive ? s.color : 'var(--text-muted)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <s.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {s.label}
            </button>
          );
        })}
        <button onClick={load} disabled={loading} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Failed to Load" subtitle={error} color="var(--non-compliant)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          

          {activeSection === 'market' && (
            <>
              <SectionHeader icon={BarChart2} title="Market Intelligence" count={marketIntelligence.length} color="var(--primary)" />
              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }} className="custom-scrollbar">
                {marketIntelligence.length === 0
                  ? <EmptyState icon={BarChart2} title="No Market Intelligence" subtitle="No recent updates have been found." color="var(--primary)" />
                  : marketIntelligence.map(item => item._cardType === 'business' ? <BusinessCard key={'b'+item.id} item={item} onSelectUrl={handleSelectUrl} /> : <MarketCard key={'m'+item.id} item={item} onSelectUrl={handleSelectUrl} />)
                }
              </div>
            </>
          )}

          {activeSection === 'purification' && (
            <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '6px' }} className="custom-scrollbar">
              <UpdatesPurification />
            </div>
          )}

          {activeSection === 'analysis' && (
            <>
              <SectionHeader icon={TrendingUp} title="Earnings & Analysis" count={analysisData.length} color="#8b5cf6" />
              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }} className="custom-scrollbar">
                {analysisData.length === 0
                  ? <EmptyState icon={TrendingUp} title="No Analysis Available" subtitle="No earnings or technical analysis updates right now." color="#8b5cf6" />
                  : analysisData.map(item => <MarketCard key={item.id} item={item} onSelectUrl={handleSelectUrl} />)
                }
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
