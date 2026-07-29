import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BarChart2,
  BookOpen, Calendar, ExternalLink, RefreshCw, Mail, Bell, ChevronRight,
  ArrowRight, Newspaper, Zap, Shield, Star, Info
} from 'lucide-react';
import { fetchUpdatesNews, fetchDigestPreference, updateDigestPreference } from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import CompanyLogo from '../CompanyLogo';

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
    halal:     { bg: 'var(--halal-bg)',     border: 'var(--halal-border)',     color: 'var(--halal)',     label: 'Halal' },
    non_halal: { bg: 'var(--non-halal-bg)', border: 'var(--non-halal-border)', color: 'var(--non-halal)', label: 'Non-Halal' },
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

/* ── Confidence pill ── */
const ConfidencePill = ({ level }) => {
  const cfg = {
    high:   { color: 'var(--halal)',     bg: 'var(--halal-bg)',     label: '● High' },
    medium: { color: 'var(--doubtful)',  bg: 'var(--doubtful-bg)',  label: '● Medium' },
    low:    { color: 'var(--text-muted)', bg: 'var(--bg-section)', label: '● Low' },
  };
  const c = cfg[level] || cfg['medium'];
  return (
    <span style={{ fontSize: '0.66rem', fontWeight: 800, color: c.color, background: c.bg, padding: '2px 8px', borderRadius: '10px' }}>
      {c.label}
    </span>
  );
};

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

/* ── Weekly Digest Banner ── */
const DigestBanner = () => {
  const [pref, setPref] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchDigestPreference()
      .then(r => setPref(r.data))
      .catch(() => setPref({ email_enabled: false, in_app_enabled: true, frequency: 'weekly', enabled: false }));
  }, []);

  const isEnabled = pref?.email_enabled || pref?.in_app_enabled;

  const handleToggle = async () => {
    try {
      setSaving(true);
      const next = isEnabled
        ? { email_enabled: false, in_app_enabled: false }
        : { email_enabled: false, in_app_enabled: true };
      const res = await updateDigestPreference(next);
      setPref(res.data);
      toastSuccess(isEnabled ? 'Weekly Digest disabled' : 'Weekly Digest enabled');
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const handleFrequency = async (freq) => {
    try {
      setSaving(true);
      const res = await updateDigestPreference({ ...pref, frequency: freq });
      setPref(res.data);
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  const handleDelivery = async (field) => {
    try {
      setSaving(true);
      const res = await updateDigestPreference({ ...pref, [field]: !pref[field] });
      setPref(res.data);
    } catch {
      toastError('Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(0,109,100,0.06) 0%, rgba(212,160,23,0.06) 100%)',
      border: '1px solid var(--primary-100)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)', pointerEvents: 'none', animation: 'float 6s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,109,100,0.08) 0%, transparent 70%)', pointerEvents: 'none', animation: 'float 8s ease-in-out infinite reverse' }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--gold-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={14} color="var(--gold)" />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weekly Digest</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-dark)', margin: '0 0 8px', lineHeight: 1.2 }}>
              Receive the Irshad Weekly Digest
            </h3>
            <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Stay informed about your portfolio's Shariah compliance status.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {['New Halal stocks', 'Non-Halal changes', 'Business activity', 'Market intelligence', 'Portfolio insights'].map(item => (
                <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 700, color: 'var(--primary)' }}>
                  <CheckCircle2 size={11} color="var(--halal)" /> {item}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <button
              onClick={handleToggle}
              disabled={saving}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                background: isEnabled ? 'var(--halal-bg)' : 'var(--primary)',
                color: isEnabled ? 'var(--halal)' : 'white',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isEnabled ? <><CheckCircle2 size={13} /> Enabled</> : <><Bell size={13} /> Enable Digest</>}
            </button>
            {isEnabled && (
              <button onClick={() => setExpanded(!expanded)} style={{ fontSize: '0.69rem', fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Settings <ChevronRight size={12} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            )}
          </div>
        </div>

        {/* Expanded settings */}
        {isEnabled && expanded && pref && (
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Delivery</div>
              {[{ key: 'email_enabled', label: 'Email' }, { key: 'in_app_enabled', label: 'In-App' }].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <div onClick={() => handleDelivery(key)} style={{ width: '36px', height: '20px', borderRadius: '10px', background: pref[key] ? 'var(--primary)' : 'var(--border)', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: pref[key] ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-body)' }}>{label}</span>
                </label>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.69rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Frequency</div>
              {['weekly', 'monthly'].map(f => (
                <button key={f} onClick={() => handleFrequency(f)} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', background: pref.frequency === f ? 'var(--primary-50)' : 'transparent', border: `1px solid ${pref.frequency === f ? 'var(--primary-100)' : 'transparent'}`, borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', width: '100%' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${pref.frequency === f ? 'var(--primary)' : 'var(--border)'}`, background: pref.frequency === f ? 'var(--primary)' : 'transparent', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pref.frequency === f ? 'var(--primary)' : 'var(--text-body)', textTransform: 'capitalize' }}>{f}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Compliance Change Card ── */
const ComplianceCard = ({ item }) => {
  const isWorsening = item.new_status === 'non_halal' || item.new_status === 'non-halal';
  const isImproving = (item.new_status === 'halal') && (item.previous_status === 'non_halal' || item.previous_status === 'non-halal');

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
    }}
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
            <a href={item.report_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
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

  return (
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
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
            {item.confidence_level && <ConfidencePill level={item.confidence_level} />}
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-body)', lineHeight: 1.5, margin: '0 0 10px' }}>{item.summary}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {item.source && <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>Source: {item.source}</span>}
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.time_ago}</span>
          </div>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.69rem', fontWeight: 800, color: 'var(--primary)', textDecoration: 'none' }}>
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
    <div className="animate-slide-up" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
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

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchUpdatesNews();
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load news & insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sections = [
    { id: 'compliance',  label: 'Compliance Changes',  icon: Shield,    color: 'var(--non-halal)' },
    { id: 'business',    label: 'Business Activity',   icon: Zap,       color: 'var(--doubtful)' },
    { id: 'market',      label: 'Market Intelligence', icon: BarChart2,  color: 'var(--primary)' },
  ];

  const complianceChanges  = data?.compliance_changes  || [];
  const businessUpdates    = data?.business_updates    || [];
  const marketIntelligence = data?.market_intelligence || [];

  return (
    <div>
      {/* Weekly Digest */}
      <DigestBanner />

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
              {complianceChanges.length === 0
                ? <EmptyState icon={CheckCircle2} title="No Recent Changes" subtitle="No companies have changed compliance status recently. You're all clear!" color="var(--halal)" />
                : complianceChanges.map(item => <ComplianceCard key={item.id} item={item} />)
              }
            </>
          )}

          {activeSection === 'business' && (
            <>
              <SectionHeader icon={Zap} title="Business Activity Updates" count={businessUpdates.length} color="var(--doubtful)" />
              {businessUpdates.length === 0
                ? <EmptyState icon={Zap} title="No Business Updates" subtitle="No new business activities have been detected from your followed companies." color="var(--doubtful)" />
                : businessUpdates.map(item => <BusinessCard key={item.id} item={item} />)
              }
            </>
          )}

          {activeSection === 'market' && (
            <>
              <SectionHeader icon={BarChart2} title="Islamic Market Intelligence" count={marketIntelligence.length} color="var(--primary)" />
              {marketIntelligence.length === 0
                ? <EmptyState icon={Newspaper} title="No Market News" subtitle="No market intelligence articles available right now. Check back soon." color="var(--primary)" />
                : marketIntelligence.map(item => <MarketCard key={item.id} item={item} />)
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}
