import React, { useState } from 'react';
import { Search, Calendar, Building2, ChevronDown, ChevronUp, Shield } from 'lucide-react';

const funds = [
  { 
    asset: 'Afrinvest Halal Fund', 
    provider: 'Afrinvest Asset Management Ltd',
    type: 'Balanced',
    launched: '2025',
    trustee: null,
    custodian: null,
    description: 'Managed by Afrinvest Asset Management Ltd, the asset-management arm of Afrinvest West Africa, overseen by an Advisory Committee of Experts (ACE). Investment Components: 70–100% in Sukuk, 30% Shariah-compliant equities.',
  },
  { 
    asset: 'ARM Halal Balanced Fund', 
    provider: 'ARM Investment Managers Ltd',
    type: 'Balanced',
    launched: '2004',
    trustee: 'Royal Exchange Plc',
    custodian: 'Rand Merchant Bank',
    description: 'One of the longest-running halal balanced funds in Nigeria. Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co).',
  },
  { 
    asset: 'ARM Sharia Compliant Fixed Income Fund', 
    provider: 'ARM Investment Managers Ltd',
    type: 'Fixed Income',
    launched: '2024',
    trustee: 'FBNQuest Trustees',
    custodian: 'Rand Merchant Bank',
    description: 'Invests in Sukuk, Mudarabah and Murabaha instruments with a minimum BBB rating. Managed by ARM Investment Managers Ltd.',
  },
  { 
    asset: 'CapitalTrust Halal Fixed Income Fund', 
    provider: 'CapitalTrust Investments & Asset Management Ltd',
    type: 'Fixed Income',
    launched: '2021',
    trustee: null,
    custodian: null,
    description: 'Standalone halal fixed-income fund managed by CapitalTrust Investments & Asset Management Ltd (founded 2006, Lagos).',
  },
  { 
    asset: 'CFG Ethical Fund', 
    provider: 'CFG Asset',
    type: 'Ethical',
    launched: null,
    trustee: 'AVA Trustees',
    custodian: 'Rand Merchant Bank',
    description: 'Managed by CFG Asset (CFG Africa investment bank). Registrar: CardinalStone. Shariah adviser: One17 Capital.',
  },
  { 
    asset: 'Cordros Halal Fixed Income Fund', 
    provider: 'Cordros Asset Management Ltd',
    type: 'Fixed Income',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'Launched alongside a matching conventional Cordros Fixed Income Fund with strict ring-fencing to prevent co-mingling of halal and conventional assets.',
  },
  { 
    asset: "D'Namaz Halal Fixed Income Fund", 
    provider: "D'Namaz Capital",
    type: 'Fixed Income',
    launched: '2025',
    trustee: null,
    custodian: null,
    description: "Benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY as a yardstick for whether returns are competitive with conventional savings. Managed by D'Namaz Capital.",
  },
  { 
    asset: 'EDC Halal Fund', 
    provider: 'EDC Fund Management',
    type: 'Balanced',
    launched: '2022',
    trustee: null,
    custodian: null,
    description: 'Asset-management subsidiary of Ecobank Nigeria. Positioned as a template for a multi-country Islamic fund beyond Nigeria.',
  },
  { 
    asset: 'Emerging Africa Halal Fund', 
    provider: 'Emerging Africa Asset Management Ltd',
    type: 'Balanced',
    launched: '2024',
    trustee: null,
    custodian: null,
    description: 'Managed by EAAML, part of the Emerging Africa Group. A newer entrant in the growing Nigerian Islamic finance landscape.',
  },
  { 
    asset: 'FSDH Halal Fund', 
    provider: 'FSDH Asset Management Ltd',
    type: 'Balanced',
    launched: '2023',
    trustee: null,
    custodian: null,
    description: 'Established as part of FSDH\'s broader "Coral Funds" family. Managed by FSDH Asset Management Ltd.',
  },
  { 
    asset: 'Lotus Halal ETF', 
    provider: 'Lotus Capital Ltd',
    type: 'ETF',
    launched: '2014',
    trustee: null,
    custodian: null,
    description: 'Tracks the NSE-Lotus Islamic Index. The only halal equity ETF listed on the NGX. Managed by Lotus Capital Ltd.',
  },
  { 
    asset: 'Lotus Halal Fixed Income Fund', 
    provider: 'Lotus Capital Ltd',
    type: 'Fixed Income',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'Invests in Sukuk plus Ijarah and Murabaha contracts. Managed by Lotus Capital Ltd.',
  },
  { 
    asset: 'Lotus Halal Investment Fund', 
    provider: 'Lotus Capital Ltd',
    type: 'Equity',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'SEC-registered Shariah-compliant equity fund — equity-based, not fixed-income. Managed by Lotus Capital Ltd.',
  },
  { 
    asset: 'Lotus Waqf (Endowment) Fund', 
    provider: 'Lotus Capital Ltd',
    type: 'Endowment',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'SEC-approved Waqf (endowment) fund — investment income perpetually funds charitable causes (education, healthcare, economic empowerment).',
  },
  { 
    asset: 'Marble Halal Commodities Fund', 
    provider: 'Marble Capital Ltd',
    type: 'Commodities',
    launched: '2021',
    trustee: null,
    custodian: null,
    description: 'SEC-approved Shariah-compliant commodities fund, investing in securitized commodities (agriculture, precious metals) — distinct from typical Sukuk/equity funds.',
  },
  { 
    asset: 'Marble Halal Fixed Income Fund', 
    provider: 'Marble Capital Ltd',
    type: 'Fixed Income',
    launched: '2023',
    trustee: null,
    custodian: null,
    description: 'Invests in low-risk Sukuk plus Ijarah and Murabaha contracts. Managed by Marble Capital Ltd.',
  },
  { 
    asset: 'Norrenberger Islamic Fund', 
    provider: 'Norrenberger Asset Management Ltd',
    type: 'Fixed Income',
    launched: '2021',
    trustee: 'UTL Trust Management Services',
    custodian: null,
    description: 'Shari\'ah compliant fixed-income fund. Managed by Norrenberger Asset Management Ltd.',
  },
  { 
    asset: 'One17 Halal Fund', 
    provider: 'One17 Capital Ltd',
    type: 'Balanced',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'Managed by One17 Capital Ltd — a SEC-licensed ethical/Shariah advisory and fund manager that also serves as Shariah adviser for other funds.',
  },
  { 
    asset: 'Stanbic IBTC Ethical Fund (Imaan Fund)', 
    provider: 'Stanbic IBTC Asset Management',
    type: 'Equity',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'Shari\'ah-compliant equity product: min. 70% Shariah-compliant equities, up to 30% Sukuk/Shariah money-market instruments.',
  },
  { 
    asset: 'Stanbic IBTC Shariah Fixed Income Fund', 
    provider: 'Stanbic IBTC Asset Management',
    type: 'Fixed Income',
    launched: '2019',
    trustee: null,
    custodian: null,
    description: 'Invests in Sukuk (minimum 70%). Managed by Stanbic IBTC Asset Management.',
  },
];

// All type styles use the app's own CSS variable tokens — no hardcoded rainbow
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
  const type = TYPE_CONFIG[fund.type] || TYPE_CONFIG['Balanced'];
  const hasMeta = fund.trustee || fund.custodian;
  const isLong = fund.description.length > 120;

  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s, transform 0.2s',
      display: 'flex',
      flexDirection: 'column',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Accent bar uses primary color */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Avatar + name + badges */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            background: 'var(--primary-50)',
            border: '1.5px solid var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.1rem', color: 'var(--primary)',
          }}>
            {fund.provider.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.3, marginBottom: '6px' }}>
              {fund.asset}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.4px',
                padding: '3px 9px', borderRadius: '20px',
                background: type.bg, color: type.color,
                textTransform: 'uppercase', border: `1px solid ${type.color}33`,
              }}>
                {fund.type}
              </span>
              {fund.launched && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Calendar size={10} /> Est. {fund.launched}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Provider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={12} color="var(--text-muted)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{fund.provider}</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)' }} />

        {/* Description */}
        <p style={{
          fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {fund.description}
        </p>

        {/* Expand toggle */}
        {(isLong || hasMeta) && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)',
              width: 'fit-content',
            }}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Trustee & Custodian chips */}
        {expanded && hasMeta && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {fund.trustee && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '8px',
                background: 'var(--bg-section)', border: '1px solid var(--border)',
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
              }}>
                <Shield size={10} />
                <span style={{ opacity: 0.7 }}>Trustee:</span> {fund.trustee}
              </span>
            )}
            {fund.custodian && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '4px 10px', borderRadius: '8px',
                background: 'var(--bg-section)', border: '1px solid var(--border)',
                fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
              }}>
                <Building2 size={10} />
                <span style={{ opacity: 0.7 }}>Custodian:</span> {fund.custodian}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');

  const filtered = funds.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.asset.toLowerCase().includes(q) || f.provider.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    const matchType = activeType === 'All' || f.type === activeType;
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

      {/* Type filter pills — using app token colors */}
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
      {filtered.length > 0 ? (
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
