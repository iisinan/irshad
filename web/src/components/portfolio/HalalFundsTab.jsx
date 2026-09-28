import React, { useState, useEffect } from 'react';
import { Search, Calendar, Building2, ChevronDown, ChevronUp, Shield, Activity, Target, Droplet } from 'lucide-react';
import { fetchNgxStocks } from '../../services/api';

const TYPE_CONFIG = {
  'Fixed Income': { bg: 'var(--primary-50)',   color: 'var(--primary)',  label: 'Fixed Income' },
  'Balanced':     { bg: 'var(--halal-bg)',      color: 'var(--halal)',    label: 'Balanced' },
  'Equity':       { bg: 'var(--primary-100)',   color: 'var(--primary)',  label: 'Equity' },
  'ETF':          { bg: 'var(--gold-50)',        color: 'var(--accent)',   label: 'ETF' },
  'Endowment':    { bg: 'var(--gold-100)',       color: 'var(--accent)',   label: 'Endowment' },
  'Commodities':  { bg: 'var(--gold-50)',        color: 'var(--accent)',   label: 'Commodities' },
  'Ethical':      { bg: 'var(--halal-bg)',       color: 'var(--halal)',    label: 'Ethical' },
};

const ALL_TYPES = ['All', ...Object.keys(TYPE_CONFIG)];

function FundCard({ fund }) {
  const [expanded, setExpanded] = useState(false);
  const typeStr = fund.sector || 'Balanced';
  const type = TYPE_CONFIG[typeStr] || TYPE_CONFIG['Balanced'];
  const fd = fund.fund_details || {};
  
  const hasMeta = fd.trustee || fd.custodian;
  const history = fd.purification_history || [];

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: '14px',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: type.color }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: type.bg, color: type.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1.1rem', flexShrink: 0
        }}>
          {fund.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0 0 6px 0', lineHeight: 1.3 }}>
            {fund.name}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '2px 8px', borderRadius: '6px', background: type.bg, color: type.color,
              fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {type.label}
            </span>
            {fd.launched && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} /> Est. {fd.launched}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Building2 size={13} color="var(--text-muted)" />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fd.provider || 'N/A'}</span>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }} />

      {/* Strategy summary (truncated) */}
      <p style={{
        fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
        display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
        WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {fd.investment_components_target || 'No strategy details provided.'}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={13} color="#3b82f6" /> Asset Mix
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {fd.asset_mix || 'Not available.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dark)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplet size={13} color="var(--doubtful, #eab308)" /> Purification Details
            </span>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              {fd.purification_note || 'Not disclosed.'}
            </p>
            {history.length > 0 && (
              <div style={{ marginTop: '8px', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-section)' }}>
                      <th style={{ padding: '6px 10px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Year</th>
                      <th style={{ padding: '6px 10px', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Per Unit (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={h.year} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600 }}>{h.year}</td>
                        <td style={{ padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--doubtful, #eab308)' }}>₦{Number(h.per_unit).toFixed(5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {hasMeta && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {fd.trustee && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  <Shield size={10} />
                  <span style={{ opacity: 0.7 }}>Trustee:</span> {fd.trustee}
                </span>
              )}
              {fd.custodian && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '8px',
                  background: 'var(--bg-section)', border: '1px solid var(--border)',
                  fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                }}>
                  <Building2 size={10} />
                  <span style={{ opacity: 0.7 }}>Custodian:</span> {fd.custodian}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
          width: 'fit-content', marginTop: '4px'
        }}
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Show less' : 'Show full details'}
      </button>

    </div>
  );
}

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNgxStocks()
      .then(res => {
        const data = res?.data || [];
        const mutualFunds = data.filter(s => s.asset_class === 'mutual_fund');
        setFunds(mutualFunds);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = funds.filter(f => {
    const q = search.toLowerCase();
    const provider = f.fund_details?.provider || '';
    const desc = f.fund_details?.investment_components_target || '';
    const matchSearch = !q || f.name.toLowerCase().includes(q) || provider.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    const matchType = activeType === 'All' || f.sector === activeType;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>
            Halal Mutual Funds
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {funds.length} SEC-approved shariah-compliant funds &amp; ETFs in Nigeria
          </p>
        </div>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '280px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search funds or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: '12px',
              border: '1px solid var(--border-strong)', background: 'var(--bg)',
              fontSize: '0.83rem', color: 'var(--text-dark)', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ALL_TYPES.map(type => {
          const cfg = TYPE_CONFIG[type];
          const isActive = activeType === type;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                padding: '5px 13px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '0.77rem', fontWeight: 700, border: '1.5px solid',
                transition: 'all 0.15s',
                borderColor: isActive ? (cfg ? cfg.color : 'var(--primary)') : 'var(--border-strong)',
                background: isActive ? (cfg ? cfg.bg : 'var(--primary-50)') : 'transparent',
                color: isActive ? (cfg ? cfg.color : 'var(--primary)') : 'var(--text-muted)',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Result hint */}
      {(search || activeType !== 'All') && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          {filtered.length} fund{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading funds...</div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
          {filtered.map((fund, i) => <FundCard key={i} fund={fund} />)}
        </div>
      ) : (
        <div style={{
          padding: '60px 20px', textAlign: 'center',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No funds found for "{search}"</p>
        </div>
      )}
    </div>
  );
}
