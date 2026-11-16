import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, AlertTriangle, CheckCircle2, BarChart2,
  ExternalLink, RefreshCw, Mail, Bell, ChevronRight,
  ArrowRight, Newspaper, Zap, Shield, Star
} from 'lucide-react';
import api, { fetchUpdatesNews } from '../../services/api';
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

/* ── Normalize status helper ── */
export const normalizeComplianceStatus = (status) => {
  if (!status) return 'unknown';
  const s = String(status).trim().toLowerCase().replace(/[-_\s]/g, '');
  if (['halal', 'compliant', 'pass', 'shariahcompliant'].includes(s)) return 'halal';
  if (['noncompliant', 'nonhalal', 'fail', 'shariahhoncompliant', 'shariahoncompliant', 'shariahncompliant', 'shariahnnoncompliant', 'shariahnoncompliant', 'haram'].includes(s)) return 'non_compliant';
  if (['doubtful', 'questionable'].includes(s)) return 'doubtful';
  if (['watchlist', 'review'].includes(s)) return 'watchlist';
  return s;
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

/* ── Skeleton loader ── */
const SkeletonLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
  </div>
);

/* ── Empty state ── */
const EmptyState = ({ icon: Icon, title, subtitle, color = 'var(--primary)' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    background: 'var(--bg-section)', borderRadius: '20px',
    border: '1px dashed var(--border)',
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '16px', marginBottom: '16px',
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={26} color={color} strokeWidth={1.5} />
    </div>
    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '8px' }}>
      {title}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, maxWidth: '280px', lineHeight: 1.6 }}>
      {subtitle}
    </div>
  </div>
);


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
  const prevNorm = normalizeComplianceStatus(item.previous_status);
  const nextNorm = normalizeComplianceStatus(item.new_status);
  const isWorsening = nextNorm === 'non_compliant';
  const isImproving = nextNorm === 'halal' && prevNorm === 'non_compliant';
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
            <StatusBadge status={prevNorm} />
            <ArrowRight size={12} color="var(--text-muted)" />
            <StatusBadge status={nextNorm} />
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
  const [activeSubTab, setActiveSubTab] = useState('changes');

  const CACHE_KEY = 'irshad_updates_compliance_cache_v3';

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
      localforage.setItem(CACHE_KEY, res.data);
    } catch (err) {
      if (!data && !silent) setError(err?.response?.data?.message || 'Failed to load compliance brief.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Clear legacy stale cache if present
    localforage.removeItem('irshad_updates_compliance_cache').catch(() => {});
    localforage.removeItem('irshad_updates_compliance_cache_v2').catch(() => {});
    localforage.getItem(CACHE_KEY).then(cached => {
      if (cached) {
        setData(cached);
        setLoading(false);
      }
    }).catch(() => {});
    load(true);
  }, []);

  useEffect(() => {
    if (!data || Array.isArray(data.sector_breakdown)) return;
    let active = true;
    api.get('/updates/monthly-spotlight')
      .then(res => {
        const sectors = res.data?.data?.sector_breakdown;
        if (active && Array.isArray(sectors)) {
          setData(prev => (prev ? { ...prev, sector_breakdown: sectors } : prev));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [data]);

  const rawList = Array.isArray(data?.compliance_changes) ? data.compliance_changes : [];
  const seenCompanies = new Set();
  const complianceChanges = rawList.filter(item => {
    const prev = normalizeComplianceStatus(item.previous_status);
    const next = normalizeComplianceStatus(item.new_status);
    if (!prev || !next || prev === 'unknown' || next === 'unknown' || prev === next) {
      return false;
    }
    const key = item.symbol || item.company_id || item.id;
    if (key && seenCompanies.has(key)) {
      return false;
    }
    if (key) seenCompanies.add(key);
    return true;
  });

  const sectorBreakdown = Array.isArray(data?.sector_breakdown) ? data.sector_breakdown : [];

  if (loading && !data) return <SkeletonLoader />;
  if (error) return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--non-compliant)', fontWeight: 800, marginBottom: '16px' }}>{error}</div>
      <button onClick={() => load(false)} style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Try Again</button>
    </div>
  );

  const subTabs = [
    { id: 'changes', label: 'Compliance Changes', icon: Shield, color: 'var(--non-compliant)', count: complianceChanges.length },
    { id: 'sectors', label: 'Sector Shariah Compliance', icon: BarChart2, color: 'var(--primary)', count: sectorBreakdown.length },
  ];

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '18px', marginBottom: '6px' }} className="hide-scrollbar">
        {subTabs.map(tab => {
          const isActive = activeSubTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px',
                borderRadius: '16px',
                border: `1px solid ${isActive ? tab.color : 'var(--border)'}`,
                background: isActive ? `color-mix(in srgb, ${tab.color} 10%, transparent)` : 'var(--bg-alt)',
                color: isActive ? tab.color : 'var(--text-muted)',
                fontSize: '0.88rem',
                fontWeight: isActive ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <IconComp size={16} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '20px',
                background: isActive ? `color-mix(in srgb, ${tab.color} 16%, transparent)` : 'var(--bg-section)',
                color: isActive ? tab.color : 'var(--text-muted)',
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeSubTab === 'changes' ? (
        <>
          <SectionHeader icon={Shield} title="Compliance Status Changes" count={complianceChanges.length} color="var(--non-compliant)" />
          {complianceChanges.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No Recent Changes" subtitle="No companies have changed compliance status recently. You're all clear!" color="var(--halal)" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complianceChanges.map(item => <ComplianceCard key={item.id} item={item} />)}
            </div>
          )}
        </>
      ) : (
        <>
          <SectionHeader icon={BarChart2} title="Sector Shariah Compliance" count={sectorBreakdown.length} color="var(--primary)" />
          {sectorBreakdown.length === 0 ? (
            <EmptyState icon={BarChart2} title="No Sector Breakdown" subtitle="Sector compliance statistics are currently unavailable." color="var(--primary)" />
          ) : (
            <div style={{ background: 'var(--bg)', borderRadius: '20px', padding: '22px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sectorBreakdown.map(sec => (
                <div key={sec.sector} style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-section)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-dark)' }}>{sec.sector}</span>
                    <span style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--halal)' }}>
                      {sec.halal_companies}/{sec.total_companies} Halal ({sec.compliance_rate}%)
                    </span>
                  </div>
                  <div style={{ height: '7px', borderRadius: '999px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, Number(sec.compliance_rate || 0))}%`, height: '100%', background: 'var(--halal)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
