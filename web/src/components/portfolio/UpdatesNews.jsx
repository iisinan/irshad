import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, CheckCircle2, BarChart2,
  ExternalLink, RefreshCw, Mail, Bell, ChevronRight,
  ArrowRight, Newspaper, Zap, Shield, Star
} from 'lucide-react';
import { fetchUpdatesNews } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import CompanyLogo from '../CompanyLogo';
import localforage from 'localforage';

/* ── Skeleton ── */
const CardSkeleton = () => {
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
        <div style={{ ...sh, width: '60%', height: '12px' }} />
      </div>
    </div>
  );
};

/* ── Status badge ── */
const StatusBadge = ({ status }) => {
  const cfg = {
    halal:     { bg: 'var(--halal-bg)',     border: 'var(--halal-border)',     color: 'var(--halal)',     label: 'Shariah Compliant' },
    non_halal: { bg: 'var(--non-halal-bg)', border: 'var(--non-halal-border)', color: 'var(--non-halal)', label: 'Shariah Non-Compliant' },
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


/* ── Compliance Change Card ── */
const ComplianceCard = ({ item }) => {
  const isWorsening = item.new_status === 'non_halal' || item.new_status === 'non-halal';
  const isImproving = (item.new_status === 'halal') && (item.previous_status === 'non_halal' || item.previous_status === 'non-halal');
  const navigate = useNavigate();

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg)',
      border: `1px solid ${isWorsening ? 'var(--non-halal-border)' : isImproving ? 'var(--halal-border)' : 'var(--border)'}`,
      borderRadius: '16px',
      padding: '18px',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/market/${item.symbol}/aaoifi`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = isWorsening ? 'var(--non-halal)' : isImproving ? 'var(--halal)' : 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isWorsening ? 'var(--non-halal-border)' : isImproving ? 'var(--halal-border)' : 'var(--border)'; }}
    >
      <div style={{ flexShrink: 0 }}>
        <CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={40} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-dark)' }}>{item.name || item.symbol}</div>
            <div style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.symbol}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <StatusBadge status={item.previous_status?.replace('-', '_')} />
            <ArrowRight size={12} color="var(--text-muted)" />
            <StatusBadge status={item.new_status?.replace('-', '_')} />
          </div>
        </div>
        {item.reason && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '10px', padding: '8px 12px', background: isWorsening ? 'var(--non-halal-bg)' : 'var(--bg-section)', borderRadius: '10px' }}>
            <span style={{ fontWeight: 700 }}>Reason: </span>{item.reason}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Updated: {item.updated_at ? new Date(item.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : item.time_ago}
          </span>
          {item.report_url && (
            <a href={item.report_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
              View Report <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Business Update Card ── */
const BusinessCard = ({ item }) => {
  const typeColors = {
    acquisition:         { color: 'var(--primary)',   bg: 'var(--primary-50)' },
    new_business:        { color: 'var(--review)',     bg: 'var(--review-bg)' },
    disposal:            { color: 'var(--doubtful)',   bg: 'var(--doubtful-bg)' },
    prohibited_activity: { color: 'var(--non-halal)', bg: 'var(--non-halal-bg)' },
    islamic_finance:     { color: 'var(--halal)',      bg: 'var(--halal-bg)' },
    regulatory:          { color: '#7C3AED',           bg: 'rgba(124,58,237,0.1)' },
  };
  const tc = typeColors[item.activity_type] || { color: 'var(--text-muted)', bg: 'var(--bg-section)' };
  const navigate = useNavigate();

  return (
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' }}
      onClick={() => navigate(`/market/${item.symbol}/aaoifi`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ flexShrink: 0 }}>
        <CompanyLogo symbol={item.symbol} logoUrl={item.logo_url} size={40} />
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
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
              Read Source <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Market Intelligence Card ── */
const MarketCard = ({ item }) => {
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
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', cursor: item.symbol ? 'pointer' : 'default' }}
      onClick={() => item.symbol && navigate(`/market/${item.symbol}/aaoifi`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `color-mix(in srgb, ${categoryColor} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
        <Icon size={15} color={categoryColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '4px', lineHeight: 1.3 }}>{item.title}</div>
        {item.content && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 8px' }}>{item.content.substring(0, 140)}{item.content.length > 140 ? '...' : ''}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {item.source && <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.source}</span>}
          <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.time_ago}</span>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.66rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none', marginLeft: 'auto' }}>
              Read More <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Empty State ── */
const EmptyState = ({ icon: Icon, title, subtitle, color = 'var(--primary)' }) => (
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
  const [activeSection, setActiveSection] = useState('compliance');

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
    { id: 'compliance',  label: 'Compliance Changes',  icon: Shield,    color: 'var(--primary)' },
    { id: 'business',    label: 'Business Activity',   icon: Zap,       color: 'var(--doubtful)' },
    { id: 'market',      label: 'Market Intelligence', icon: BarChart2,  color: 'var(--primary)' },
  ];

  const complianceChanges  = data?.compliance_changes  || [];
  const businessUpdates    = data?.business_updates    || [];
  const marketIntelligence = data?.market_intelligence || [];

  return (
    <div>

      {/* Section Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '12px',
              border: `1px solid ${activeSection === s.id ? s.color : 'var(--border)'}`,
              background: activeSection === s.id ? `color-mix(in srgb, ${s.color} 10%, transparent)` : 'var(--bg)',
              backdropFilter: activeSection === s.id ? 'blur(10px)' : 'none',
              color: activeSection === s.id ? s.color : 'var(--text-muted)',
              fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <s.icon size={13} />
            {s.label}
            {s.id === 'compliance' && complianceChanges.length > 0 && (
              <span style={{ fontSize: '0.63rem', fontWeight: 900, padding: '1px 6px', borderRadius: '10px', background: s.color, color: 'white', lineHeight: '16px' }}>
                {complianceChanges.length}
              </span>
            )}
          </button>
        ))}
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
        <EmptyState icon={AlertTriangle} title="Failed to Load" subtitle={error} color="var(--non-halal)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeSection === 'compliance' && (
            <>
              <SectionHeader icon={Shield} title="Compliance Status Changes" count={complianceChanges.length} color="var(--non-halal)" />
              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }} className="custom-scrollbar">
                {complianceChanges.length === 0
                  ? <EmptyState icon={CheckCircle2} title="No Recent Changes" subtitle="No companies have changed compliance status recently. You're all clear!" color="var(--halal)" />
                  : complianceChanges.map(item => <ComplianceCard key={item.id} item={item} />)
                }
              </div>
            </>
          )}

          {activeSection === 'business' && (
            <>
              <SectionHeader icon={Zap} title="Business Activity Updates" count={businessUpdates.length} color="var(--doubtful)" />
              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }} className="custom-scrollbar">
                {businessUpdates.length === 0
                  ? <EmptyState icon={Zap} title="No Business Updates" subtitle="No new business activities have been detected from your followed companies." color="var(--doubtful)" />
                  : businessUpdates.map(item => <BusinessCard key={item.id} item={item} />)
                }
              </div>
            </>
          )}

          {activeSection === 'market' && (
            <>
              <SectionHeader icon={BarChart2} title="Islamic Market Intelligence" count={marketIntelligence.length} color="var(--primary)" />
              <div style={{ maxHeight: '600px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }} className="custom-scrollbar">
                {marketIntelligence.length === 0
                  ? <EmptyState icon={Newspaper} title="No Market News" subtitle="No market intelligence articles available right now. Check back soon." color="var(--primary)" />
                  : marketIntelligence.map(item => <MarketCard key={item.id} item={item} />)
                }
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
