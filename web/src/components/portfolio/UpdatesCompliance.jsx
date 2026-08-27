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


/* ── Compliance Change Card ── */
const ComplianceCard = ({ item }) => {
  const isWorsening = item.new_status === 'non_compliant' || item.new_status === 'non-compliant';
  const isImproving = (item.new_status === 'halal') && (item.previous_status === 'non_compliant' || item.previous_status === 'non-compliant');
  const navigate = useNavigate();

  return (
    <div className="animate-slide-up" style={{
      background: 'var(--bg)',
      border: `1px solid ${isWorsening ? 'var(--non-compliant-border)' : isImproving ? 'var(--halal-border)' : 'var(--border)'}`,
      borderRadius: '16px',
      padding: '18px',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/market/${item.symbol}/aaoifi`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = isWorsening ? 'var(--non-compliant)' : isImproving ? 'var(--halal)' : 'var(--primary-100)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = isWorsening ? 'var(--non-compliant-border)' : isImproving ? 'var(--halal-border)' : 'var(--border)'; }}
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
          <div style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '10px', padding: '8px 12px', background: isWorsening ? 'var(--non-compliant-bg)' : 'var(--bg-section)', borderRadius: '10px' }}>
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

export default function UpdatesCompliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
      localforage.setItem('irshad_updates_compliance_cache', res.data);
    } catch (err) {
      if (!data && !silent) setError(err?.response?.data?.message || 'Failed to load compliance changes.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    localforage.getItem('irshad_updates_compliance_cache').then(cached => {
      if (cached) {
        setData(cached);
        setLoading(false);
      }
    }).catch(() => {});
    load(true);
  }, []);

  const complianceChanges = data?.compliance_changes || [];

  if (loading && !data) return <SkeletonLoader />;
  if (error) return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--non-compliant)', fontWeight: 800, marginBottom: '16px' }}>{error}</div>
      <button onClick={() => load(false)} style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <SectionHeader icon={Shield} title="Compliance Status Changes" count={complianceChanges.length} color="var(--non-compliant)" />
      
      {complianceChanges.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No Recent Changes" subtitle="No companies have changed compliance status recently. You're all clear!" color="var(--halal)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {complianceChanges.map(item => <ComplianceCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
