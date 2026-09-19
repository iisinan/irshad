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
    description: 'Managed by Afrinvest Asset Management Ltd, the asset-management arm of Afrinvest West Africa and overseen by an Advisory Committee of Experts (ACE). Investment Components: 70–100% in Sukuk, 30% Shariah-compliant equities.',
  },
  { 
    asset: 'ARM Halal Balanced Fund', 
    provider: 'ARM Investment Managers Ltd',
    type: 'Balanced',
    launched: '2004',
    trustee: 'Royal Exchange Plc',
    custodian: 'Rand Merchant Bank',
    description: 'Managed by ARM Investment Managers Ltd (part of Asset & Resource Mgt Holding Co). One of the longest-running halal balanced funds in Nigeria.',
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
    description: 'Launched alongside a matching conventional Cordros Fixed Income Fund — with strict ring-fencing to prevent co-mingling of halal and conventional assets.',
  },
  { 
    asset: "D'Namaz Halal Fixed Income Fund", 
    provider: "D'Namaz Capital",
    type: 'Fixed Income',
    launched: '2025',
    trustee: null,
    custodian: null,
    description: "Benchmarked against a blend of 3-, 5- and 10-year FGN Sukuk plus NITTY, judging whether returns are competitive with conventional savings. Managed by D'Namaz Capital.",
  },
  { 
    asset: 'EDC Halal Fund', 
    provider: 'EDC Fund Management',
    type: 'Balanced',
    launched: '2022',
    trustee: null,
    custodian: null,
    description: 'Managed by EDC Fund Management, the asset-management subsidiary of Ecobank Nigeria. Positioned as a template for a multi-country Islamic fund beyond Nigeria.',
  },
  { 
    asset: 'Emerging Africa Halal Fund', 
    provider: 'Emerging Africa Asset Management Ltd',
    type: 'Balanced',
    launched: '2024',
    trustee: null,
    custodian: null,
    description: 'Managed by Emerging Africa Asset Management Ltd (EAAML), part of the Emerging Africa Group. A newer entrant in the growing Nigerian Islamic finance space.',
  },
  { 
    asset: 'FSDH Halal Fund', 
    provider: 'FSDH Asset Management Ltd',
    type: 'Balanced',
    launched: '2023',
    trustee: null,
    custodian: null,
    description: 'Established as part of FSDH\'s broader "Coral Funds" family. Managed by FSDH Asset Management Ltd (FSDH Group).',
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
    description: 'SEC-registered Shariah-compliant equity fund — equity-based (not fixed-income). Managed by Lotus Capital Ltd.',
  },
  { 
    asset: 'Lotus Waqf (Endowment) Fund', 
    provider: 'Lotus Capital Ltd',
    type: 'Endowment',
    launched: null,
    trustee: null,
    custodian: null,
    description: 'SEC-approved Waqf (endowment) fund — investment income perpetually funds charitable causes (education, healthcare, economic empowerment). A unique structure in Nigerian Islamic finance.',
  },
  { 
    asset: 'Marble Halal Commodities Fund', 
    provider: 'Marble Capital Ltd',
    type: 'Commodities',
    launched: '2021',
    trustee: null,
    custodian: null,
    description: 'SEC-approved Shariah-compliant commodities fund, investing in securitized commodities (agriculture, precious metals) — distinct from the typical Sukuk/equity mix. Managed by Marble Capital Ltd.',
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
    description: 'Shari\'ah-compliant equity product with min. 70% Shariah-compliant equities and up to 30% Sukuk/Shariah money-market instruments. Managed by Stanbic IBTC Asset Management.',
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

const TYPE_CONFIG = {
  'Fixed Income': { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  'Balanced':     { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  'Equity':       { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6' },
  'ETF':          { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  'Endowment':    { bg: 'rgba(236,72,153,0.1)', color: '#ec4899' },
  'Commodities':  { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  'Ethical':      { bg: 'rgba(14,165,233,0.1)', color: '#0ea5e9' },
};

const AVATAR_COLORS = [
  '#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#0ea5e9','#f97316',
];

function getAvatarColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function FundCard({ fund }) {
  const [expanded, setExpanded] = useState(false);
  const accentColor = getAvatarColor(fund.provider);
  const typeConfig = TYPE_CONFIG[fund.type] || TYPE_CONFIG['Balanced'];

  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Accent Top Bar */}
      <div style={{ height: '4px', background: accentColor, borderRadius: '16px 16px 0 0' }} />

      {/* Card Body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          {/* Avatar */}
          <div style={{
            width: 46, height: 46, borderRadius: '12px', flexShrink: 0,
            background: `${accentColor}22`,
            border: `1.5px solid ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '1.2rem', color: accentColor,
          }}>
            {fund.provider.charAt(0)}
          </div>
          {/* Title + Badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-dark)', lineHeight: 1.3 }}>
                {fund.asset}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Fund Type Badge */}
              <span style={{
                fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.5px',
                padding: '3px 8px', borderRadius: '20px',
                background: typeConfig.bg, color: typeConfig.color,
                textTransform: 'uppercase',
              }}>
                {fund.type}
              </span>
              {/* Launch Year */}
              {fund.launched && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Calendar size={11} />
                  Est. {fund.launched}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Provider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Building2 size={13} color="var(--text-muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{fund.provider}</span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0,
          display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          transition: 'all 0.3s',
        }}>
          {fund.description}
        </p>

        {/* Expand / Collapse + Trustee/Custodian */}
        {(fund.description.length > 120 || fund.trustee || fund.custodian) && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.75rem', fontWeight: 700, color: accentColor,
              width: 'fit-content',
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Trustee & Custodian — visible when expanded */}
        {expanded && (fund.trustee || fund.custodian) && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {fund.trustee && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '8px',
                background: 'var(--bg-section)', border: '1px solid var(--border)',
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
              }}>
                <Shield size={11} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Trustee:</span> {fund.trustee}
              </div>
            )}
            {fund.custodian && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 10px', borderRadius: '8px',
                background: 'var(--bg-section)', border: '1px solid var(--border)',
                fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
              }}>
                <Building2 size={11} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Custodian:</span> {fund.custodian}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const ALL_TYPES = ['All', ...Object.keys(TYPE_CONFIG)];

export default function HalalFundsTab() {
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('All');

  const filteredFunds = funds.filter(f => {
    const matchesSearch = 
      f.asset.toLowerCase().includes(search.toLowerCase()) || 
      f.provider.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeType === 'All' || f.type === activeType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-dark)', letterSpacing: '-0.5px', margin: 0 }}>
            Halal Mutual Funds
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {funds.length} shariah-compliant mutual funds and ETFs in Nigeria
          </p>
        </div>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '300px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search funds or providers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px',
              border: '1px solid var(--border)', background: 'var(--bg)',
              fontSize: '0.85rem', color: 'var(--text-dark)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Type Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ALL_TYPES.map(type => {
          const config = TYPE_CONFIG[type];
          const isActive = activeType === type;
          return (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1.5px solid',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
                borderColor: isActive ? (config ? config.color : 'var(--text-dark)') : 'var(--border)',
                background: isActive ? (config ? config.bg : 'var(--bg-section)') : 'transparent',
                color: isActive ? (config ? config.color : 'var(--text-dark)') : 'var(--text-muted)',
              }}
            >
              {type}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {(search || activeType !== 'All') && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          {filteredFunds.length} result{filteredFunds.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Card Grid */}
      {filteredFunds.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px',
        }}>
          {filteredFunds.map((fund, idx) => <FundCard key={idx} fund={fund} />)}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: 0 }}>No funds found for "{search}"</p>
        </div>
      )}
    </div>
  );
}
